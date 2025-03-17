import axios, { AxiosError } from "axios";
import type { InsertContent } from "@shared/schema";
import { XMLParser } from "fast-xml-parser";
import rateLimit from "axios-rate-limit";

// Configure axios with rate limiting
const http = rateLimit(axios.create(), {
  maxRequests: 2,
  perMilliseconds: 1000
});

// Interfaces for type safety
interface ContentConfig {
  maxRetries: number;
  timeout: number;
  minExcerptLength: number;
}

const config: ContentConfig = {
  maxRetries: 3,
  timeout: 10000,
  minExcerptLength: 50
};

// Utility function for retry logic
async function fetchWithRetry<T>(fn: () => Promise<T>, retries = config.maxRetries): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error instanceof AxiosError && error.response?.status === 429)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

async function getFallbackImage(title: string, type: string): Promise<string | null> {
  try {
    // Use Unsplash API with related search terms
    const searchTerm = encodeURIComponent(`${title} ${type}`);
    const response = await http.get(`https://source.unsplash.com/featured/800x600/?${searchTerm}`);
    return response.request?.res?.responseUrl || null;
  } catch (error) {
    console.error('Failed to fetch fallback image:', error);
    return null;
  }
}

function ensureThumbnail(content: InsertContent): Promise<InsertContent> {
  if (content.thumbnail) return Promise.resolve(content);
  return getFallbackImage(content.title, content.contentType)
    .then(fallbackImage => ({
      ...content,
      thumbnail: fallbackImage
    }));
}

// Validate content item
function isValidContentItem(item: InsertContent): boolean {
  return !!(
    item.sourceId &&
    item.title?.length > 3 &&
    (item.excerpt?.length ?? 0) >= config.minExcerptLength &&
    item.url
  );
}

export async function fetchWikipediaContent(): Promise<InsertContent[]> {
  try {
    const response = await fetchWithRetry(() =>
      http.get("https://en.wikipedia.org/w/api.php", {
        timeout: config.timeout,
        params: {
          action: "query",
          format: "json",
          prop: "extracts|pageimages",
          generator: "random",
          grnnamespace: 0,
          grnlimit: 15,
          exchars: 500, // Increased for better excerpts
          exlimit: 15,
          explaintext: true,
          piprop: "thumbnail",
          pithumbsize: 500,
          origin: "*",
        },
      })
    );

    const filtered = Object.values(response.data.query.pages)
      .map((page: any) => ({
        sourceId: String(page.pageid),
        source: "wikipedia",
        contentType: "article",
        title: page.title?.trim(),
        excerpt: page.extract?.trim(),
        thumbnail: page.thumbnail?.source,
        metadata: { pageid: page.pageid },
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      }))
      .filter(isValidContentItem);
    
    // Add fallback images where missing
    const withImages = await Promise.all(
      filtered.map(content => ensureThumbnail(content))
    );
    return withImages;
  } catch (error) {
    console.error("Wikipedia fetch error:", error);
    return [];
  }
}

export async function fetchBlogContent(): Promise<InsertContent[]> {
  try {
    // For public API access, we don't need an API key
    const response = await fetchWithRetry(() =>
      http.get("https://dev.to/api/articles", {
        timeout: config.timeout,
        params: {
          per_page: 15,
          state: "rising", // Get trending content without requiring auth
        },
        headers: {
          "Accept": "application/json",
        },
      })
    );

    return response.data
      .map((post: any) => ({
        sourceId: String(post.id),
        source: "blogs",
        contentType: "blog_post",
        title: post.title?.trim(),
        excerpt: post.description || post.body_markdown?.slice(0, 300),
        thumbnail: post.cover_image || post.social_image,
        metadata: {
          author: post.user?.name,
          tags: post.tag_list || post.tags,
          readingTime: post.reading_time_minutes,
        },
        url: post.url || post.canonical_url,
      }))
      .filter(isValidContentItem);
  } catch (error) {
    console.error("Blog fetch error:", error);
    return [];
  }
}

export async function fetchBookContent(): Promise<InsertContent[]> {
  try {
    const subjects = ["science", "programming", "technology", "fiction"];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

    const response = await fetchWithRetry(() =>
      http.get(`https://openlibrary.org/subjects/${randomSubject}.json`, {
        timeout: config.timeout,
        params: {
          limit: 15,
          details: true, // Get more detailed results
        },
      })
    );

    return response.data.works
      .map((work: any) => ({
        sourceId: work.key,
        source: "books",
        contentType: "book",
        title: work.title?.trim(),
        excerpt:
          work.description?.value ||
          work.authors?.map((a: any) => a.name).join(", ") ||
          work.subtitle,
        thumbnail: work.cover_id
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
          : null,
        metadata: {
          authors: work.authors,
          firstPublishYear: work.first_publish_year,
          subjects: work.subjects || work.subject,
        },
        url: `https://openlibrary.org${work.key}`,
      }))
      .filter(isValidContentItem);
  } catch (error) {
    console.error("Book fetch error:", error);
    return [];
  }
}

export async function fetchTextbookContent(): Promise<InsertContent[]> {
  try {
    const response = await fetchWithRetry(() =>
      http.get("https://openstax.org/api/v2/pages/?type=books.Book", {
        timeout: config.timeout,
        params: {
          per_page: 15,
        },
      })
    );

    const books = response.data.results || [];
    return books
      .map((book: any) => ({
        sourceId: String(book.id),
        source: "textbooks",
        contentType: "textbook",
        title: book.title?.trim(),
        excerpt: book.description || book.promotional_text || "OpenStax textbook",
        thumbnail: book.cover_url || book.high_resolution_cover_url,
        metadata: {
          subject: book.subjects?.[0]?.name,
          edition: book.current_edition,
          language: book.language || "en",
        },
        url: `https://openstax.org/details/${book.slug}`,
      }))
      .filter(isValidContentItem);
  } catch (error) {
    console.error("Textbook fetch error:", error);
    return [];
  }
}

export async function fetchArXivContent(): Promise<InsertContent[]> {
  try {
    const response = await fetchWithRetry(() =>
      http.get("http://export.arxiv.org/api/query", {
        timeout: config.timeout,
        params: {
          search_query: "cat:cs.AI OR cat:cs.LG OR cat:cs.CV",
          start: 0,
          max_results: 15,
          sortBy: "lastUpdatedDate",
          sortOrder: "descending",
        },
      })
    );

    const parser = new XMLParser();
    const parsed = parser.parse(response.data);
    const entries = parsed.feed?.entry || [];

    return entries
      .map((entry: any) => ({
        sourceId: entry.id,
        source: "arxiv",
        contentType: "research_paper",
        title: entry.title?.trim().replace(/\s+/g, " "),
        excerpt: entry.summary?.trim().replace(/\s+/g, " ").slice(0, 300),
        thumbnail: null,
        metadata: {
          authors: Array.isArray(entry.author)
            ? entry.author.map((a: any) => a.name)
            : [entry.author?.name],
          arxivId: entry.id.split("/").pop(),
          updated: entry.updated,
        },
        url: entry.id.replace("abs", "pdf"),
      }))
      .filter(isValidContentItem);
  } catch (error) {
    console.error("arXiv fetch error:", error);
    return [];
  }
}

function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export async function fetchContent(source?: string): Promise<InsertContent[]> {
  try {
    if (source) {
      const fetchers: Record<string, () => Promise<InsertContent[]>> = {
        wikipedia: fetchWikipediaContent,
        blogs: fetchBlogContent,
        books: fetchBookContent,
        textbooks: fetchTextbookContent,
        arxiv: fetchArXivContent,
      };
      
      // Check if the requested source exists
      if (!fetchers[source]) {
        console.warn(`Source "${source}" not found in available fetchers`);
        return [];
      }
      
      return fetchers[source]();
    }

    // Use public APIs that don't require keys for deployment
    const fetchersToUse = [
      fetchWikipediaContent,
      fetchBlogContent,
      fetchBookContent,
      fetchTextbookContent,
      fetchArXivContent,
    ];

    const results = await Promise.allSettled(
      fetchersToUse.map(fetcher => fetcher())
    );

    const contents = results
      .filter(result => result.status === "fulfilled")
      .flatMap(result => (result as PromiseFulfilledResult<InsertContent[]>).value);

    return shuffleArray(contents).slice(0, 50); // Limit total results
  } catch (error) {
    console.error("Content fetch error:", error);
    return [];
  }
}

export async function fetchGoodreadsContent(): Promise<InsertContent[]> {
  try {
    // Note: Goodreads API is deprecated, this is a workaround using RSS
    const response = await fetchWithRetry(() =>
      http.get("https://www.goodreads.com/review/list_rss.php", {
        timeout: config.timeout,
        params: {
          shelf: "currently-reading",
          key: process.env.GOODREADS_KEY, // Requires user-specific key
        },
      })
    );

    const parser = new XMLParser();
    const parsed = parser.parse(response.data);
    const items = parsed.rss?.channel?.item || [];

    return items
      .map((item: any) => ({
        sourceId: item.guid,
        source: "goodreads",
        contentType: "book_review",
        title: item.title?.trim(),
        excerpt: item.description?.trim().slice(0, 300),
        thumbnail: item.book_image_url,
        metadata: {
          author: item.author_name,
          rating: item.user_rating,
          bookId: item.book_id,
        },
        url: item.link,
      }))
      .filter(isValidContentItem)
      .slice(0, 15);
  } catch (error) {
    console.error("Goodreads fetch error:", error);
    return [];
  }
}