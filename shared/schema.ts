import { pgTable, text, serial, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  source: text("source").notNull(),
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
};
