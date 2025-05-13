import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  publicKey: text("public_key").notNull(),
  otpEnabled: boolean("otp_enabled").default(true).notNull(),
  otpSecret: text("otp_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
});

export const loginActivities = pgTable("login_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  location: text("location"),
  status: text("status").notNull(), // 'successful', 'failed', 'new_location'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  publicKey: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  token: true,
  deviceInfo: true,
  ipAddress: true,
  location: true,
});

export const insertLoginActivitySchema = createInsertSchema(loginActivities).pick({
  userId: true,
  ipAddress: true,
  deviceInfo: true,
  location: true,
  status: true,
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(),
  catchphrase: z.string().min(4),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  catchphrase: z.string().min(4),
  publicKey: z.string(),
});

export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertLoginActivity = z.infer<typeof insertLoginActivitySchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type LoginActivity = typeof loginActivities.$inferSelect;
