import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { setupAuth } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth (Passport + Sessions)
  await setupAuth(app);

  // Middleware for admin-only routes
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  };

  // === AUTH ROUTES ===
  // (Handled mainly by setupAuth, but we can add specific ones here if needed, 
  // currently setupAuth handles /api/login, /api/register, /api/logout, /api/user)

  // === SETTINGS ROUTES ===
  app.get(api.settings.get.path, async (req, res) => {
    const s = await storage.getSettings();
    res.json(s);
  });

  app.post(api.settings.update.path, requireAdmin, async (req, res) => {
    try {
      const input = req.body; // Validation handled by schema sync in shared/routes
      const s = await storage.updateSettings(
        input.companyName, 
        input.cnpj,
        input.cei,
        input.responsibleCpf,
        input.address
      );
      res.json(s);
    } catch (err) {
      res.status(400).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // === USERS ROUTES (Admin only) ===

  app.get(api.users.list.path, requireAdmin, async (req, res) => {
    const users = await storage.listUsers();
    res.json(users);
  });

  app.post(api.users.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Erro ao criar usuário" });
      }
    }
  });

  app.put(api.users.update.path, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(id, input);
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete(api.users.delete.path, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "Usuário removido" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao remover usuário" });
    }
  });

  // === POINTS ROUTES ===
  app.post(api.points.clockIn.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const user = req.user as any;
    const input = api.points.clockIn.input.parse(req.body);
    const entry = await storage.createTimeEntry({
      userId: user.id,
      timestamp: new Date(),
      type: input.type
    });
    res.status(201).json(entry);
  });

  app.get(api.points.list.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const user = req.user as any;
    const userId = user.role === 'admin' 
      ? (req.query.userId ? parseInt(req.query.userId as string) : undefined)
      : user.id;

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const entries = await storage.listTimeEntries({ userId, startDate, endDate });
    res.json(entries);
  });

  function pad(val: string | number, len: number): string {
    let str = String(val);
    while (str.length < len) str = "0" + str;
    return str.slice(-len);
  }

  function formatAfdDate(date: Date): string {
    const d = new Date(date);
    const day = pad(d.getDate(), 2);
    const month = pad(d.getMonth() + 1, 2);
    const year = d.getFullYear();
    return `${day}${month}${year}`;
  }

  // === EXPORT AFD ===
  app.get(api.points.exportAfd.path, requireAdmin, async (req, res) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const entries = await storage.listTimeEntries({ userId, startDate, endDate });
    const settings = await storage.getSettings();
    
    // Dados da empresa fixos ou do banco
    const companyName = (settings?.companyName || "HOSPITAL MED CENTER LTDA").substring(0, 150);
    const cnpj = (settings?.cnpj || "42938662000157").replace(/\D/g, '');
    
    // AFD (Portaria 671) Generation
    let content = "";
    let nsr = 1;

    // Formatação de datas para o cabeçalho
    const dataInicial = formatAfdDate(startDate || (entries.length > 0 ? entries[entries.length-1].timestamp : new Date()));
    const dataFinal = formatAfdDate(endDate || new Date());
    const dataGeracao = formatAfdDate(new Date());
    const horaGeracao = pad(new Date().getHours(), 2) + pad(new Date().getMinutes(), 2);

    // Registro 001 - Cabeçalho (Padrão Portaria 1510/671)
    // NSR(9) "000000000", Tipo(1) "1", IdEmpregador(1) "1" (CNPJ), CNPJ(14), CEI(12), Razão Social(150), NumFabricaçãoREP(17), DtIni(8), DtFim(8), DtGeracao(8), HrGeracao(4)
    content += `${pad(0, 9)}11${pad(cnpj, 14)}${pad(settings?.cei?.replace(/\D/g, '') || "", 12)}${pad(companyName.toUpperCase(), 150)}${pad("99999999999999999", 17)}${dataInicial}${dataFinal}${dataGeracao}${horaGeracao}\r\n`; 
    
    for (const entry of entries) {
      // Registro Tipo 3 - Marcação de Ponto
      // NSR(9), Tipo(1) "3", Data(8), Hora(4), PIS(12)
      const dateStr = formatAfdDate(entry.timestamp);
      const timeStr = pad(entry.timestamp.getHours(), 2) + pad(entry.timestamp.getMinutes(), 2);
      // Usando PIS se disponível, ou CPF (ajustado para 12 dígitos com zeros à esquerda conforme padrão comum)
      const pisCpf = entry.user.document ? entry.user.document.replace(/\D/g, '') : "000000000000";
      
      content += `${pad(nsr++, 9)}3${dateStr}${timeStr}${pad(pisCpf, 12)}\r\n`;
    }
    
    // Registro 999 - Trailer
    // NSR(9) "999999999", QtTipo2(9), QtTipo3(9), QtTipo4(9), QtTipo5(9), TipoRegistro(1) "9"
    content += `${pad(999999999, 9)}${pad(0, 9)}${pad(entries.length, 9)}${pad(0, 9)}${pad(0, 9)}9\r\n`;

    res.setHeader('Content-Type', 'text/plain; charset=iso-8859-1');
    res.setHeader('Content-Disposition', `attachment; filename="afd_export_${formatAfdDate(new Date())}.txt"`);
    res.send(content);
  });

  // Seed Admin if not exists
  const existingAdmin = await storage.getUserByUsername('admin');
  if (!existingAdmin) {
    await storage.createUser({
      username: 'admin',
      password: 'admin', // In production use hash!
      role: 'admin',
      name: 'Administrador',
      document: '00000000000'
    });
    console.log("Admin user seeded: admin / admin");
  }

  return httpServer;
}

function pad(val: string | number, len: number): string {
  let str = String(val);
  while (str.length < len) str = "0" + str;
  return str.slice(-len);
}
