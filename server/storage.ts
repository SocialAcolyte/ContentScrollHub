import { contents, users, type Content, type InsertContent, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getContents(page: number, source?: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  getContent(id: number): Promise<Content | undefined>;

  // User management methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private contents: Map<number, Content>;
  private users: Map<number, User>;
  private usersByUsername: Map<string, User>;
  sessionStore: session.Store;
  currentId: number;
  currentUserId: number;

  constructor() {
    this.contents = new Map();
    this.users = new Map();
    this.usersByUsername = new Map();
    this.currentId = 1;
    this.currentUserId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  async getContents(page: number, source?: string): Promise<Content[]> {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    let contents = Array.from(this.contents.values());

    if (source) {
      contents = contents.filter(content => content.source === source);
    }

    return contents.slice(start, start + pageSize);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = this.currentId++;
    const content: Content = { 
      ...insertContent, 
      id,
      fetchedAt: new Date(),
      excerpt: insertContent.excerpt || null,
      thumbnail: insertContent.thumbnail || null,
      metadata: insertContent.metadata || null
    };
    this.contents.set(id, content);
    return content;
  }

  async getContent(id: number): Promise<Content | undefined> {
    return this.contents.get(id);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersByUsername.get(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      isPremium: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    };
    this.users.set(id, user);
    this.usersByUsername.set(user.username, user);
    return user;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const updatedUser: User = {
      ...user,
      stripeCustomerId: customerId
    };
    this.users.set(userId, updatedUser);
    this.usersByUsername.set(updatedUser.username, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const updatedUser: User = {
      ...user,
      stripeCustomerId: info.customerId,
      stripeSubscriptionId: info.subscriptionId,
      isPremium: true
    };
    this.users.set(userId, updatedUser);
    this.usersByUsername.set(updatedUser.username, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();