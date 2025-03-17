import { contents, users, type Content, type InsertContent, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { eq, sql } from 'drizzle-orm';

const MemoryStore = createMemoryStore(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool);

export interface IStorage {
  getContents(page: number, source?: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  getContent(id: number): Promise<Content | undefined>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User>;
  addUserLikedContent(userId: number, contentId: number): Promise<User>;
  removeUserLikedContent(userId: number, contentId: number): Promise<User>;
  addUserHiddenContent(userId: number, contentId: number): Promise<User>;
  incrementContentLikeCount(contentId: number): Promise<Content>;
  decrementContentLikeCount(contentId: number): Promise<Content>;
  incrementContentShareCount(contentId: number): Promise<Content>;
  incrementContentReportCount(contentId: number): Promise<Content>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  async getContents(page: number, source?: string): Promise<Content[]> {
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    let query = db.select().from(contents);
    if (source) {
      query = query.where(eq(contents.source, source));
    }

    return await query.limit(pageSize).offset(offset);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [content] = await db.insert(contents).values(insertContent).returning();
    return content;
  }

  async getContent(id: number): Promise<Content | undefined> {
    const [content] = await db.select().from(contents).where(eq(contents.id, id));
    return content;
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

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: info.customerId,
        stripeSubscriptionId: info.subscriptionId,
        isPremium: true
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async addUserLikedContent(userId: number, contentId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const likedContent = user.likedContent || [];
    if (!likedContent.includes(contentId)) {
      const [updatedUser] = await db
        .update(users)
        .set({ likedContent: [...likedContent, contentId] })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    }
    return user;
  }

  async removeUserLikedContent(userId: number, contentId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const [updatedUser] = await db
      .update(users)
      .set({ 
        likedContent: (user.likedContent || []).filter(id => id !== contentId)
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async addUserHiddenContent(userId: number, contentId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const hiddenContent = user.hiddenContent || [];
    if (!hiddenContent.includes(contentId)) {
      const [updatedUser] = await db
        .update(users)
        .set({ hiddenContent: [...hiddenContent, contentId] })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    }
    return user;
  }

  async incrementContentLikeCount(contentId: number): Promise<Content> {
    const [content] = await db
      .update(contents)
      .set({ likeCount: sql`${contents.likeCount} + 1` })
      .where(eq(contents.id, contentId))
      .returning();
    return content;
  }

  async decrementContentLikeCount(contentId: number): Promise<Content> {
    const [content] = await db
      .update(contents)
      .set({ likeCount: sql`GREATEST(${contents.likeCount} - 1, 0)` })
      .where(eq(contents.id, contentId))
      .returning();
    return content;
  }

  async incrementContentShareCount(contentId: number): Promise<Content> {
    const [content] = await db
      .update(contents)
      .set({ shareCount: sql`${contents.shareCount} + 1` })
      .where(eq(contents.id, contentId))
      .returning();
    return content;
  }

  async incrementContentReportCount(contentId: number): Promise<Content> {
    const [content] = await db
      .update(contents)
      .set({ reportCount: sql`${contents.reportCount} + 1` })
      .where(eq(contents.id, contentId))
      .returning();
    return content;
  }
}

export const storage = new MemStorage();