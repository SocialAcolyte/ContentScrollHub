import { contents, type Content, type InsertContent } from "@shared/schema";

export interface IStorage {
  getContents(page: number, source?: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  getContent(id: number): Promise<Content | undefined>;
}

export class MemStorage implements IStorage {
  private contents: Map<number, Content>;
  currentId: number;

  constructor() {
    this.contents = new Map();
    this.currentId = 1;
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
      fetchedAt: new Date()
    };
    this.contents.set(id, content);
    return content;
  }

  async getContent(id: number): Promise<Content | undefined> {
    return this.contents.get(id);
  }
}

export const storage = new MemStorage();
