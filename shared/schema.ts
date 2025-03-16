import { pgTable, text, serial, json, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ContentType = {
  ARTICLE: "article",
  TEXTBOOK: "textbook",
  BOOK: "book",
  REPOSITORY: "repository",
  RESEARCH_PAPER: "research_paper",
  BLOG_POST: "blog_post",
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isPremium: boolean("is_premium").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  likedContent: json("liked_content").$type<number[]>().default([]),
  preferences: json("preferences").$type<Record<string, number>>().default({}),
  hiddenContent: json("hidden_content").$type<number[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  source: text("source").notNull(),
  contentType: text("content_type").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  thumbnail: text("thumbnail"),
  metadata: json("metadata").$type<Record<string, any>>(),
  url: text("url").notNull(),
  likeCount: integer("like_count").default(0),
  shareCount: integer("share_count").default(0),
  reportCount: integer("report_count").default(0),
  fetchedAt: timestamp("fetched_at").defaultNow()
});

export const insertContentSchema = createInsertSchema(contents).omit({ 
  id: true,
  fetchedAt: true
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isPremium: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contents.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type ContentSource = {
  id: string;
  name: string;
  icon: string;
  contentType: typeof ContentType[keyof typeof ContentType];
  isPremium?: boolean;
};