import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABELAS ===

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyName: text("company_name").notNull().default("Hospital Med Center"),
  cnpj: text("cnpj").notNull().default("12345678901234"),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "employee"] }).notNull().default("employee"),
  name: text("name").notNull(),
  document: text("document"), // CPF ou PIS para AFD
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const timeEntries = sqliteTable("time_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  type: text("type", { enum: ["entrada", "saida"] }).notNull(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true });
export const updateSettingsSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ inválido").max(18, "CNPJ inválido"),
});

// === TIPOS ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type Settings = typeof settings.$inferSelect;

// === API CONTRACT TYPES ===

// Auth
export type LoginRequest = { username: string; password: string };
export type AuthResponse = User;

// Users
export type CreateUserRequest = InsertUser;
export type UpdateUserRequest = Partial<InsertUser>;

// Time Entries
export type CreateTimeEntryRequest = { type: "entrada" | "saida" };
export type TimeEntryResponse = TimeEntry & { user?: User };

// Reports
export type ReportFilter = {
  startDate?: string;
  endDate?: string;
  userId?: number;
};
