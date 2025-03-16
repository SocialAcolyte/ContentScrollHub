import axios from "axios";
import type { InsertContent } from "@shared/schema";

export async function fetchWikipediaContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "https://en.wikipedia.org/w/api.php",
      {
        params: {
          action: "query",
          format: "json",
          prop: "extracts|pageimages",
          generator: "random",
          grnnamespace: 0,
          grnlimit: 15, // Increased from 10
          exchars: 300,
          exlimit: 15,
          explaintext: true,
          piprop: "thumbnail",
          pithumbsize: 500,
          origin: "*",
        },
      }
    );

    return Object.values(response.data.query.pages).map((page: any) => ({
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
          per_page: 15, // Increased from 10
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
    const subjects = ['science', 'programming', 'technology', 'fiction'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

    const response = await axios.get(
      `https://openlibrary.org/subjects/${randomSubject}.json`,
      {
        params: {
          limit: 15 // Increased from 10
        }
      }
    );

    return response.data.works.map((work: any) => ({
      sourceId: work.key,
      source: "books",
      contentType: "book",
      title: work.title,
      excerpt: work.authors?.map((a: any) => a.name).join(', '),
      thumbnail: work.cover_id ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg` : null,
      metadata: {
        authors: work.authors,
        firstPublishYear: work.first_publish_year,
        subjects: work.subject
      },
      url: `https://openlibrary.org${work.key}`
    }));
  } catch (error) {
    console.error("Error fetching book content:", error);
    return [];
  }
}

export async function fetchTextbookContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "https://openstax.org/api/v2/subjects"
    );

    const books = response.data.items
      .filter((subject: any) => subject.books && subject.books.length > 0)
      .flatMap((subject: any) => subject.books)
      .slice(0, 15); // Take up to 15 books

    return books.map((book: any) => ({
      sourceId: String(book.id),
      source: "textbooks",
      contentType: "textbook",
      title: book.title,
      excerpt: book.description || 'OpenStax textbook',
      thumbnail: book.cover_url,
      metadata: {
        subject: book.subject,
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

export async function fetchArXivContent(): Promise<InsertContent[]> {
  try {
    const response = await axios.get(
      "http://export.arxiv.org/api/query",
      {
        params: {
          search_query: "cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CV",
          start: 0,
          max_results: 15,
          sortBy: "lastUpdatedDate",
          sortOrder: "descending"
        }
      }
    );

    // Parse XML response using string manipulation (since it's simple XML)
    const entries = response.data.split('<entry>').slice(1);
    return entries.map((entry: string) => {
      const title = entry.match(/<title>(.*?)<\/title>/s)?.[1]?.trim() || '';
      const summary = entry.match(/<summary>(.*?)<\/summary>/s)?.[1]?.trim() || '';
      const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
      const authors = entry.match(/<author>(.*?)<\/author>/g)?.map(
        (author: string) => author.match(/<name>(.*?)<\/name>/)?.[1]
      ) || [];

      return {
        sourceId: id,
        source: "arxiv",
        contentType: "research_paper",
        title: title.replace(/\n/g, ' '),
        excerpt: summary.replace(/\n/g, ' ').slice(0, 300),
        thumbnail: null,
        metadata: {
          authors,
          arxivId: id.split('/').pop()
        },
        url: id.replace('abs', 'pdf')
      };
    });
  } catch (error) {
    console.error("Error fetching arXiv content:", error);
    return [];
  }
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function fetchContent(source?: string): Promise<InsertContent[]> {
  try {
    let contents: InsertContent[] = [];

    if (source) {
      // Fetch from specific source
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
        case "arxiv":
          contents = await fetchArXivContent();
          break;
        default:
          contents = [];
      }
    } else {
      // Fetch from all sources in parallel
      const fetchPromises = [
        fetchWikipediaContent(),
        fetchBlogContent(),
        fetchBookContent(),
        fetchTextbookContent(),
        fetchArXivContent()
      ];

      const results = await Promise.all(
        fetchPromises.map(p => p.catch(error => {
          console.error("Error fetching content:", error);
          return [];
        }))
      );

      // Interleave and shuffle results
      const maxLength = Math.max(...results.map(arr => arr.length));
      contents = [];

      // First round of interleaving
      for (let i = 0; i < maxLength; i++) {
        for (let j = 0; j < results.length; j++) {
          if (results[j][i]) {
            contents.push(results[j][i]);
          }
        }
      }

      // Additional shuffle for more randomness
      contents = shuffleArray(contents);
    }

    return contents;
  } catch (error) {
    console.error("Error fetching content:", error);
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