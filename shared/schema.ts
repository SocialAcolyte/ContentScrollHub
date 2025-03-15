import { pgTable, text, serial, json, timestamp } from "drizzle-orm/pg-core";
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
  fetchedAt: timestamp("fetched_at").defaultNow()
});

export const insertContentSchema = createInsertSchema(contents).omit({ 
  id: true,
  fetchedAt: true
});

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contents.$inferSelect;

export type ContentSource = {
  id: string;
  name: string;
  icon: string;
  contentType: typeof ContentType[keyof typeof ContentType];
};