import { pgTable, text, jsonb, boolean, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import type { Game, Cell, Ship } from "@/types/game";

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Game tables
export const games = pgTable("games", {
  id: varchar("id", { length: 255 }).primaryKey(),
  player1Id: text("player1_id").notNull(),
  player2Id: text("player2_id"),
  currentTurn: varchar("current_turn", { length: 10 }).notNull().default("player1"),
  status: varchar("status", { length: 20 }).notNull().default("waiting"),
  player1Board: jsonb("player1_board").$type<Cell[][]>().notNull(),
  player2Board: jsonb("player2_board").$type<Cell[][]>().notNull(),
  player1Ships: jsonb("player1_ships").$type<Ship[]>().notNull().default([]),
  player2Ships: jsonb("player2_ships").$type<Ship[]>().notNull().default([]),
  player1Ready: boolean("player1_ready").notNull().default(false),
  player2Ready: boolean("player2_ready").notNull().default(false),
  winner: varchar("winner", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GameRow = typeof games.$inferSelect;
export type NewGameRow = typeof games.$inferInsert;
