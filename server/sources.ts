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
      contentType: "article",
      title: page.title,
      excerpt: page.extract,
      thumbnail: page.thumbnail?.source,
      metadata: { pageid: page.pageid },
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    }));
  } catch (error) {
    console.error("Error fetching Wikipedia content:", error);
    return [];
  }
}

export async function fetchBlogContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "https://dev.to/api/articles",
      {
        params: {
          per_page: 10,
          top: 1
        },
        headers: {
          "Accept": "application/json"
        }
      }
    );

    return response.data.map((post: any) => ({
      sourceId: String(post.id),
      source: "blogs",
      contentType: "blog_post",
      title: post.title,
      excerpt: post.description,
      thumbnail: post.cover_image,
      metadata: {
        author: post.user.name,
        tags: post.tags
      },
      url: post.url
    }));
  } catch (error) {
    console.error("Error fetching blog content:", error);
    return [];
  }
}

export async function fetchBookContent(): Promise<InsertContent[]> {
  try {
    // Using Project Gutenberg's catalog
    const response = await axios.get(
      "https://gutendex.com/books",
      {
        params: {
          mime_type: "text/plain",
          languages: "en"
        }
      }
    );

    return response.data.results.map((book: any) => ({
      sourceId: String(book.id),
      source: "books",
      contentType: "book",
      title: book.title,
      excerpt: `${book.authors[0]?.name || 'Unknown Author'} - ${book.subjects.slice(0, 3).join(', ')}`,
      thumbnail: book.formats["image/jpeg"],
      metadata: {
        author: book.authors[0]?.name,
        languages: book.languages,
        subjects: book.subjects
      },
      url: book.formats["text/plain"]
    }));
  } catch (error) {
    console.error("Error fetching book content:", error);
    return [];
  }
}

export async function fetchTextbookContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "https://openstax.org/api/v2/pages",
      {
        params: {
          type: "books.Book",
          limit: 10
        }
      }
    );

    return response.data.items.map((book: any) => ({
      sourceId: String(book.id),
      source: "textbooks",
      contentType: "textbook",
      title: book.title,
      excerpt: book.description,
      thumbnail: book.cover_url,
      metadata: {
        subjects: book.subjects,
        edition: book.edition,
        language: book.language
      },
      url: `https://openstax.org/details/${book.slug}`
    }));
  } catch (error) {
    console.error("Error fetching textbook content:", error);
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
  try {
    let contents: InsertContent[] = [];

    if (source) {
      switch (source) {
        case "wikipedia":
          contents = await fetchWikipediaContent();
          break;
        case "blogs":
          contents = await fetchBlogContent();
          break;
        case "books":
          contents = await fetchBookContent();
          break;
        case "textbooks":
          contents = await fetchTextbookContent();
          break;
      }
    } else {
      // If no source specified, fetch from all sources and shuffle
      const results = await Promise.all([
        fetchWikipediaContent(),
        fetchBlogContent(),
        fetchBookContent(),
        fetchTextbookContent()
      ]);

      // Flatten and shuffle the results
      contents = results.flat().sort(() => Math.random() - 0.5);
    }

    return contents;
  } catch (error) {
    console.error("Error fetching content:", error);
    return [];
  }
}