import { users, timeEntries, settings, type User, type InsertUser, type TimeEntry, type InsertTimeEntry, type Settings } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  listUsers(): Promise<User[]>;

  getSettings(): Promise<Settings>;
  updateSettings(companyName: string, cnpj: string): Promise<Settings>;
  
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  listTimeEntries(filter?: { userId?: number; startDate?: Date; endDate?: Date }): Promise<(TimeEntry & { user: User })[]>;
  sessionStore: session.Store;
}

export class SQLiteStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getSettings(): Promise<Settings> {
    const [s] = await db.select().from(settings).where(eq(settings.id, 1));
    if (!s) {
      const [newS] = await db.insert(settings).values({ 
        companyName: "Hospital Med Center",
        cnpj: "12345678901234"
      }).returning();
      return newS;
    }
    return s;
  }

  async updateSettings(companyName: string, cnpj: string): Promise<Settings> {
    const [s] = await db.update(settings).set({ companyName, cnpj }).where(eq(settings.id, 1)).returning();
    if (!s) {
      const [newS] = await db.insert(settings).values({ companyName, cnpj }).returning();
      return newS;
    }
    return s;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [newEntry] = await db.insert(timeEntries).values(entry).returning();
    return newEntry;
  }

  async listTimeEntries(filter?: { userId?: number; startDate?: Date; endDate?: Date }): Promise<(TimeEntry & { user: User })[]> {
    let query = db.select({
      id: timeEntries.id,
      userId: timeEntries.userId,
      timestamp: timeEntries.timestamp,
      type: timeEntries.type,
      user: users
    })
    .from(timeEntries)
    .leftJoin(users, eq(timeEntries.userId, users.id))
    .orderBy(desc(timeEntries.timestamp));

    const conditions = [];
    if (filter?.userId) {
      conditions.push(eq(timeEntries.userId, filter.userId));
    }
    if (filter?.startDate) {
      conditions.push(gte(timeEntries.timestamp, filter.startDate));
    }
    if (filter?.endDate) {
      conditions.push(lte(timeEntries.timestamp, filter.endDate));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    // @ts-ignore
    const rows = await query;
    return rows.map((row: any) => ({
      ...row,
      user: row.user!
    }));
  }
}

export const storage = new SQLiteStorage();
