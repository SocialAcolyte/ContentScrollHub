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
  try {
    // Using Goodreads public RSS feed since the API is deprecated
    const response = await axios.get(
      "https://www.goodreads.com/review/recent_reviews.xml",
      {
        params: {
          format: "xml",
        },
      }
    );

    // Parse XML response (simplified for example)
    // In a real implementation, use a proper XML parser
    const reviews = []; // Parse XML here
    return reviews.map(review => ({
      sourceId: review.id,
      source: "goodreads",
      title: review.book.title,
      excerpt: review.body,
      thumbnail: review.book.image_url,
      metadata: {
        author: review.book.author,
        rating: review.rating
      },
      url: review.url
    }));
  } catch (error) {
    console.error("Error fetching Goodreads content:", error);
    return [];
  }
}

export async function fetchArXivContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "http://export.arxiv.org/api/query",
      {
        params: {
          search_query: "cat:cs.AI+OR+cat:cs.LG",
          start: 0,
          max_results: 10,
          sortBy: "lastUpdatedDate",
          sortOrder: "descending"
        }
      }
    );

    // Parse XML response
    const papers = []; // Parse XML response here
    return papers.map(paper => ({
      sourceId: paper.id,
      source: "arxiv",
      title: paper.title,
      excerpt: paper.summary,
      thumbnail: null, // arXiv doesn't provide thumbnails
      metadata: {
        authors: paper.authors,
        categories: paper.categories,
        published: paper.published
      },
      url: paper.link
    }));
  } catch (error) {
    console.error("Error fetching arXiv content:", error);
    return [];
  }
}

export async function fetchGitHubContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "https://api.github.com/search/repositories",
      {
        params: {
          q: "stars:>1000",
          sort: "stars",
          order: "desc",
          per_page: 10
        },
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Add GitHub token if available
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    );

    return response.data.items.map(repo => ({
      sourceId: String(repo.id),
      source: "github",
      title: repo.full_name,
      excerpt: repo.description,
      thumbnail: repo.owner.avatar_url,
      metadata: {
        stars: repo.stargazers_count,
        language: repo.language,
        topics: repo.topics,
        forks: repo.forks_count
      },
      url: repo.html_url
    }));
  } catch (error) {
    console.error("Error fetching GitHub content:", error);
    return [];
  }
}

export async function fetchContent(source?: string): Promise<InsertContent[]> {
  switch (source) {
    case "wikipedia":
      return fetchWikipediaContent();
    case "goodreads":
      return fetchGoodreadsContent();
    case "arxiv":
      return fetchArXivContent();
    case "github":
      return fetchGitHubContent();
    default:
      // If no source specified, fetch from all sources
      const results = await Promise.all([
        fetchWikipediaContent(),
        fetchGitHubContent(),
        fetchArXivContent()
        // Temporarily disable Goodreads until XML parsing is implemented
        // fetchGoodreadsContent()
      ]);
      return results.flat();
  }
}