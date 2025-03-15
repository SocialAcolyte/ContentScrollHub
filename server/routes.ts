import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";

const getContentsSchema = z.object({
  page: z.string().transform(Number),
  source: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/contents", async (req, res) => {
    try {
      const { page, source } = getContentsSchema.parse(req.query);
      const contents = await storage.getContents(page, source);
      res.json(contents);
    } catch (error) {
      res.status(400).json({ error: "Invalid request parameters" });
    }
  });

  // Fetch content from source APIs
  app.get("/api/source/:source", async (req, res) => {
    const { source } = req.params;
    try {
      // In a real implementation, we would integrate with actual APIs
      // This is just to demonstrate the error handling pattern
      throw new Error(`API integration for ${source} not implemented`);
    } catch (error) {
      res.status(503).json({ 
        error: `Failed to fetch content from ${source}`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return createServer(app);
}
