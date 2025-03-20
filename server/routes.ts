import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { fetchContent } from "./sources";

const getContentsSchema = z.object({
  page: z.string().transform(Number),
  source: z.string().optional(),
  search: z.string().optional()
});

// Check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "You must be logged in to perform this action" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(200).json(null);
    }
  });
  
  // Content fetching endpoint
  app.get("/api/contents", async (req, res) => {
    try {
      const { page, source, search } = getContentsSchema.parse(req.query);
      
      // Always fetch new content for search queries or if page 1 (always fresh content)
      if (search || page === 1) {
        const newContents = await fetchContent(source, search);
        
        // Only filter liked/stored content if we have an authenticated user
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          const user = await storage.getUser(req.user.id);
          
          if (user && user.hiddenContent && Array.isArray(user.hiddenContent)) {
            // Get already stored content IDs to filter them out
            const storedContentIds = await storage.getStoredContentIds(source);
            
            // Filter the content that is liked/reported but hidden by user
            return res.json(newContents.filter(content => {
              // Check if the content is in the database (has an ID)
              const storedContent = storedContentIds.find(
                sc => sc.sourceId === content.sourceId && sc.source === content.source
              );
              
              // Keep the content if it's not in the hidden list
              return !storedContent || !user.hiddenContent!.includes(storedContent.id);
            }));
          }
          
          // No hidden content, just return the new content
          return res.json(newContents);
        }
        
        // No authenticated user, just return the new content
        return res.json(newContents);
      }
      
      // For pagination (page > 1), get stored content
      let contents = await storage.getContents(page, source);
      
      // Filter out hidden content for the current user
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const user = await storage.getUser(req.user.id);
        if (user && user.hiddenContent && Array.isArray(user.hiddenContent)) {
          contents = contents.filter(content => !user.hiddenContent!.includes(content.id));
        }
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
  
  // Refresh content from source
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
  
  // Get a specific content item
  app.get("/api/contents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      const content = await storage.getContent(id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json(content);
    } catch (error) {
      console.error(`Error fetching content ${req.params.id}:`, error);
      res.status(500).json({ 
        error: `Failed to fetch content`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // User likes content
  app.post("/api/user/like/:contentId", isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      // Check if content exists in DB
      let content = await storage.getContent(contentId);
      
      // If content doesn't exist in DB but raw content data is provided in the request body
      // (Handling ephemeral content that hasn't been stored yet)
      if (!content && req.body && req.body.content) {
        // Store the content since the user is liking it
        content = await storage.createContent(req.body.content);
      } else if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      // Add content to user's liked content
      if (req.user && req.user.id) {
        await storage.addUserLikedContent(req.user.id, content.id);
        res.json({ success: true, contentId: content.id });
      } else {
        res.status(401).json({ error: "User not authenticated" });
      }
    } catch (error) {
      console.error(`Error liking content ${req.params.contentId}:`, error);
      res.status(500).json({ 
        error: `Failed to like content`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // User unlikes content
  app.delete("/api/user/like/:contentId", isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      // Remove content from user's liked content
      if (req.user && req.user.id) {
        await storage.removeUserLikedContent(req.user.id, contentId);
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "User not authenticated" });
      }
    } catch (error) {
      console.error(`Error unliking content ${req.params.contentId}:`, error);
      res.status(500).json({ 
        error: `Failed to unlike content`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // User hides content
  app.post("/api/user/hide/:contentId", isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      const content = await storage.getContent(contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      // Add content to user's hidden content
      if (req.user && req.user.id) {
        await storage.addUserHiddenContent(req.user.id, contentId);
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "User not authenticated" });
      }
    } catch (error) {
      console.error(`Error hiding content ${req.params.contentId}:`, error);
      res.status(500).json({ 
        error: `Failed to hide content`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Increment content like count
  app.post("/api/contents/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      await storage.incrementContentLikeCount(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error(`Error incrementing like count for content ${req.params.id}:`, error);
      res.status(500).json({ 
        error: `Failed to increment like count`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Decrement content like count
  app.delete("/api/contents/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      await storage.decrementContentLikeCount(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error(`Error decrementing like count for content ${req.params.id}:`, error);
      res.status(500).json({ 
        error: `Failed to decrement like count`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Increment content share count
  app.post("/api/contents/:id/share", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      await storage.incrementContentShareCount(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error(`Error incrementing share count for content ${req.params.id}:`, error);
      res.status(500).json({ 
        error: `Failed to increment share count`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Report content
  app.post("/api/contents/:id/report", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      await storage.incrementContentReportCount(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error(`Error reporting content ${req.params.id}:`, error);
      res.status(500).json({ 
        error: `Failed to report content`,
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return createServer(app);
}