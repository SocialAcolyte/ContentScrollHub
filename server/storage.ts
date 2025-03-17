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
  
  // Content interaction methods
  addUserLikedContent(userId: number, contentId: number): Promise<User>;
  removeUserLikedContent(userId: number, contentId: number): Promise<User>;
  addUserHiddenContent(userId: number, contentId: number): Promise<User>;
  incrementContentLikeCount(contentId: number): Promise<Content>;
  decrementContentLikeCount(contentId: number): Promise<Content>;
  incrementContentShareCount(contentId: number): Promise<Content>;
  incrementContentReportCount(contentId: number): Promise<Content>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private db: any;
  sessionStore: session.Store;
  
  constructor() {
    // Initialize Replit DB
    import('node:process').then(process => {
      import('@replit/database').then(replitDB => {
        this.db = new replitDB.default(process.env.REPLIT_DB_URL);
        // Initialize counters if they don't exist
        this.db.get('currentId').then((val: number) => {
          if (!val) this.db.set('currentId', 1);
        });
        this.db.get('currentUserId').then((val: number) => {
          if (!val) this.db.set('currentUserId', 1);
        });
      });
    });
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create a demo user
    this.createUser({
      username: "demouser",
      email: "demo@example.com",
      password: "password123", // In a real app, this would be hashed
    });
  }

  async getContents(page: number, source?: string): Promise<Content[]> {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    
    // Get all content keys
    const contentKeys = await this.db.list('content_');
    const contents = await Promise.all(
      contentKeys.map(key => this.db.get(key))
    );
    
    let contentList = contents.filter(Boolean);
    
    if (source) {
      contentList = contentList.filter(content => content.source === source);
    }

    // Sort by most recent first
    contentList.sort((a, b) => {
      const dateA = new Date(a.fetchedAt || 0);
      const dateB = new Date(b.fetchedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return contentList.slice(start, start + pageSize);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = this.currentId++;
    const content: Content = { 
      ...insertContent, 
      id,
      fetchedAt: new Date(),
      excerpt: insertContent.excerpt || null,
      thumbnail: insertContent.thumbnail || null,
      metadata: insertContent.metadata || null,
      likeCount: 0,
      shareCount: 0,
      reportCount: 0
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
      stripeSubscriptionId: null,
      likedContent: [],
      preferences: {},
      hiddenContent: []
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
  
  // Content interaction methods
  async addUserLikedContent(userId: number, contentId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    // Check if already liked to prevent duplicates
    if (!user.likedContent) {
      user.likedContent = [];
    }
    
    if (!user.likedContent.includes(contentId)) {
      const updatedUser: User = {
        ...user,
        likedContent: [...user.likedContent, contentId]
      };
      this.users.set(userId, updatedUser);
      this.usersByUsername.set(updatedUser.username, updatedUser);
      return updatedUser;
    }
    
    return user;
  }
  
  async removeUserLikedContent(userId: number, contentId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    if (!user.likedContent) {
      user.likedContent = [];
      return user;
    }
    
    const updatedUser: User = {
      ...user,
      likedContent: user.likedContent.filter(id => id !== contentId)
    };
    this.users.set(userId, updatedUser);
    this.usersByUsername.set(updatedUser.username, updatedUser);
    return updatedUser;
  }
  
  async addUserHiddenContent(userId: number, contentId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    // Check if already hidden
    if (!user.hiddenContent) {
      user.hiddenContent = [];
    }
    
    if (!user.hiddenContent.includes(contentId)) {
      const updatedUser: User = {
        ...user,
        hiddenContent: [...user.hiddenContent, contentId]
      };
      this.users.set(userId, updatedUser);
      this.usersByUsername.set(updatedUser.username, updatedUser);
      return updatedUser;
    }
    
    return user;
  }
  
  async incrementContentLikeCount(contentId: number): Promise<Content> {
    const content = await this.getContent(contentId);
    if (!content) throw new Error('Content not found');
    
    const updatedContent: Content = {
      ...content,
      likeCount: (content.likeCount || 0) + 1
    };
    this.contents.set(contentId, updatedContent);
    return updatedContent;
  }
  
  async decrementContentLikeCount(contentId: number): Promise<Content> {
    const content = await this.getContent(contentId);
    if (!content) throw new Error('Content not found');
    
    const newLikeCount = Math.max(0, (content.likeCount || 0) - 1);
    const updatedContent: Content = {
      ...content,
      likeCount: newLikeCount
    };
    this.contents.set(contentId, updatedContent);
    return updatedContent;
  }
  
  async incrementContentShareCount(contentId: number): Promise<Content> {
    const content = await this.getContent(contentId);
    if (!content) throw new Error('Content not found');
    
    const updatedContent: Content = {
      ...content,
      shareCount: (content.shareCount || 0) + 1
    };
    this.contents.set(contentId, updatedContent);
    return updatedContent;
  }
  
  async incrementContentReportCount(contentId: number): Promise<Content> {
    const content = await this.getContent(contentId);
    if (!content) throw new Error('Content not found');
    
    const updatedContent: Content = {
      ...content,
      reportCount: (content.reportCount || 0) + 1
    };
    this.contents.set(contentId, updatedContent);
    return updatedContent;
  }
}

export const storage = new MemStorage();