import axios from "axios";
import type { InsertContent } from "@shared/schema";

interface WikipediaResponse {
  query: {
    pages: Record<string, {
      pageid: number;
      title: string;
      extract: string;
      thumbnail?: { source: string };
    }>;
  };
}

interface GoodreadsResponse {
  books: Array<{
    id: string;
    title: string;
    description: string;
    image_url: string;
    url: string;
  }>;
}

export async function fetchWikipediaContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get<WikipediaResponse>(
      "https://en.wikipedia.org/w/api.php",
      {
        params: {
          action: "query",
          format: "json",
          prop: "extracts|pageimages",
          generator: "random",
          grnnamespace: 0,
          grnlimit: 10,
          exchars: 300,
          exlimit: 10,
          explaintext: true,
          piprop: "thumbnail",
          pithumbsize: 500,
          origin: "*",
        },
      }
    );

    return Object.values(response.data.query.pages).map((page) => ({
      sourceId: String(page.pageid),
      source: "wikipedia",
      title: page.title,
      excerpt: page.extract,
      thumbnail: page?.thumbnail?.source,
      metadata: { pageid: page.pageid },
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    }));
  } catch (error) {
    console.error("Error fetching Wikipedia content:", error);
    return [];
  }
}

export async function fetchGoodreadsContent(): Promise<InsertContent[]> {
  // Note: Goodreads API requires authentication and is being deprecated
  // This is a placeholder implementation
  return [];
}

export async function fetchOpenLibraryContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "https://openlibrary.org/subjects/science.json?limit=10"
    );
    
    return response.data.works.map((work: any) => ({
      sourceId: work.key,
      source: "openlibrary",
      title: work.title,
      excerpt: work.excerpt,
      thumbnail: `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`,
      metadata: { key: work.key },
      url: `https://openlibrary.org${work.key}`,
    }));
  } catch (error) {
    console.error("Error fetching OpenLibrary content:", error);
    return [];
  }
}

export async function fetchArxivContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "http://export.arxiv.org/api/query?search_query=all:physics&start=0&max_results=10"
    );
    
    // Parse XML response and extract data
    // This is a placeholder implementation
    return [];
  } catch (error) {
    console.error("Error fetching arXiv content:", error);
    return [];
  }
}

export async function fetchContent(source?: string): Promise<InsertContent[]> {
  switch (source) {
    case "wikipedia":
      return fetchWikipediaContent();
    case "goodreads":
      return fetchGoodreadsContent();
    case "openlibrary":
      return fetchOpenLibraryContent();
    case "arxiv":
      return fetchArxivContent();
    default:
      // If no source specified, fetch from Wikipedia as default
      return fetchWikipediaContent();
  }
}
