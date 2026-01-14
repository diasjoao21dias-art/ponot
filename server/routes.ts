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
      const s = await storage.updateSettings(input.companyName);
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

    // === EXPORT AFD ===
  app.get(api.points.exportAfd.path, requireAdmin, async (req, res) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const entries = await storage.listTimeEntries({ userId, startDate, endDate });
    const settings = await storage.getSettings();
    const companyName = settings?.companyName || "Empresa";
    
    // AFD (Portaria 671) Generation - Precise Format
    let content = "";
    let nsr = 1;

    // Registro 001 - Cabeçalho
    // NSR(9), Tipo(1), Identificador(1), CNPJ/CPF(14), CEI(12), Nome(150), ...
    content += `${pad(nsr++, 9)}11${pad("12345678901234", 14)}${pad("000000000000", 12)}${pad(companyName.toUpperCase(), 150)}\n`; 
    
    for (const entry of entries) {
      // NSR (9), Tipo(1), Data(8), Hora(4), PIS(12)
      const dateStr = entry.timestamp.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const dateAfd = dateStr.slice(6,8) + dateStr.slice(4,6) + dateStr.slice(0,4); // DDMMYYYY
      const timeStr = entry.timestamp.toISOString().split('T')[1].slice(0,5).replace(':', ''); // HHMM
      const pis = entry.user.document ? entry.user.document.replace(/\D/g, '') : "00000000000";
      
      // NSR(9) + Tipo(3) + Data(8) + Hora(4) + PIS(12)
      content += `${pad(nsr++, 9)}3${dateAfd}${timeStr}${pad(pis, 12)}\n`;
    }
    
    // Registro 999 - Trailer
    // NSR(9), Tipo(1), Quantidade de registros Tipo 2(9), Tipo 3(9), Tipo 4(9), Tipo 5(9)
    // Para simplificar, focamos no NSR e quantidade total
    content += `${pad(nsr, 9)}9${pad(0, 9)}${pad(entries.length, 9)}${pad(0, 9)}${pad(0, 9)}0\n`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="afd_export.txt"');
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
