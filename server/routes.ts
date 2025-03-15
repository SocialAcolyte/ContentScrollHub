import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { fetchContent } from "./sources";

const getContentsSchema = z.object({
  page: z.string().transform(Number),
  source: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/contents", async (req, res) => {
    try {
      const { page, source } = getContentsSchema.parse(req.query);
      let contents = await storage.getContents(page, source);

      // If no contents or first page, fetch from sources
      if (contents.length === 0 && page === 1) {
        const newContents = await fetchContent(source);
        for (const content of newContents) {
          await storage.createContent(content);
        }
        contents = await storage.getContents(page, source);
      }

      res.json(contents);
    } catch (error) {
      console.error("Error in /api/contents:", error);
      res.status(400).json({ 
        error: "Failed to fetch contents",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/refresh/:source", async (req, res) => {
    try {
      const { source } = req.params;
      const newContents = await fetchContent(source);

      for (const content of newContents) {
        await storage.createContent(content);
      }

      res.json({ message: `Refreshed content from ${source}` });
    } catch (error) {
      console.error(`Error refreshing ${req.params.source} content:`, error);
      res.status(503).json({ 
        error: `Failed to refresh content from ${req.params.source}`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return createServer(app);
}