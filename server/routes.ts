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
      const input = api.settings.update.input.parse(req.body);
      const s = await storage.updateSettings(input.companyName, input.cnpj);
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
    const companyName = (settings?.companyName || "Empresa").substring(0, 150);
    const cnpj = settings?.cnpj || "12345678901234";
    
    // AFD (Portaria 671) Generation
    let content = "";
    let nsr = 1;

    // Registro 001 - Cabeçalho (Padrão Portaria 671)
    const dataInicial = startDate ? formatAfdDate(startDate) : (entries.length > 0 ? formatAfdDate(entries[entries.length-1].timestamp) : formatAfdDate(new Date()));
    const dataFinal = endDate ? formatAfdDate(endDate) : formatAfdDate(new Date());
    const dataGeracao = new Date().toISOString().replace(/\.\d+Z$/, "-0300"); // Formato ISO 8601 aproximado

    // NSR(9), Tipo(1), IdEmpregador(1), CNPJ/CPF(14), CEI(12), Nome(150), NumFabricacao(17), DtIni(8), DtFim(8), DtGeracao(24), Versao(3), ...
    content += `${pad(0, 9)}11${pad(cnpj, 14)}${pad("", 12)}${pad(companyName.toUpperCase(), 150)}${pad("99999999999999999", 17)}${dataInicial}${dataFinal}${pad(dataGeracao, 24)}003${pad("99999999999999999", 17)}1${pad(cnpj, 14)}${pad("", 4)}\r\n`; 
    
    for (const entry of entries) {
      // Registro Tipo 3 - Marcação de Ponto
      // NSR(9), Tipo(1), DataHora(24), PIS/CPF(12), CRC(4)
      const isoDateTime = entry.timestamp.toISOString().replace(/\.\d+Z$/, "-0300");
      const cpf = entry.user.document ? entry.user.document.replace(/\D/g, '').substring(0, 11) : "00000000000";
      
      content += `${pad(nsr++, 9)}3${pad(isoDateTime, 24)}${pad(cpf, 12)}${pad("", 4)}\r\n`;
    }
    
    // Registro 999 - Trailer
    // NSR(9), Qt2(9), Qt3(9), Qt4(9), Qt5(9), Qt6(9), Qt7(9), Tipo(1), Assinatura(...)
    content += `${pad(999999999, 9)}${pad(0, 9)}${pad(entries.length, 9)}${pad(0, 9)}${pad(0, 9)}${pad(0, 9)}${pad(0, 9)}9\r\n`;

    res.setHeader('Content-Type', 'text/plain; charset=iso-8859-1');
    res.setHeader('Content-Disposition', `attachment; filename="afd_export_${formatAfdDate(new Date())}.txt"`);
    res.send(content);
  });

  function formatAfdDate(date: Date): string {
    const d = new Date(date);
    const day = pad(d.getDate(), 2);
    const month = pad(d.getMonth() + 1, 2);
    const year = d.getFullYear();
    return `${day}${month}${year}`;
  }

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
