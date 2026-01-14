import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABELAS ===

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
  type: text("type", { enum: ["entrada", "saida"] }).notNull(), // Pode expandir para intervalo, etc.
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true });

// === TIPOS ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

// === API CONTRACT TYPES ===

// Auth
export type LoginRequest = { username: string; password: string };
export type AuthResponse = User;

// Users
export type CreateUserRequest = InsertUser;
export type UpdateUserRequest = Partial<InsertUser>;

// Time Entries
export type CreateTimeEntryRequest = { type: "entrada" | "saida" }; // Timestamp gerado no server
export type TimeEntryResponse = TimeEntry & { user?: User };

// Reports
export type ReportFilter = {
  startDate?: string; // ISO Date
  endDate?: string;   // ISO Date
  userId?: number;
};
