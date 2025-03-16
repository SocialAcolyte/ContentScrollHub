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
    // Using OpenLibrary API
    const subjects = ['science', 'programming', 'technology', 'fiction'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

    const response = await axios.get(
      `https://openlibrary.org/subjects/${randomSubject}.json`,
      {
        params: {
          limit: 10
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
    // Fetch OpenStax subjects first
    const subjectsResponse = await axios.get("https://openstax.org/api/v2/subjects");
    const subjects = subjectsResponse.data.items.filter((s: any) => s.books?.length > 0);

    // Get a random subject and its books
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const books = randomSubject.books || [];

    return books.map((book: any) => ({
      sourceId: String(book.id),
      source: "textbooks",
      contentType: "textbook",
      title: book.title,
      excerpt: `${randomSubject.name} - ${book.description || 'Open textbook'}`,
      thumbnail: book.cover_url,
      metadata: {
        subject: randomSubject.name,
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

export async function fetchGitHubContent(): Promise<InsertContent[]> {
  try {
    // Randomize search queries for variety
    const topics = ['machine-learning', 'web-development', 'data-science', 'mobile-apps'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const response = await axios.get(
      "https://api.github.com/search/repositories",
      {
        params: {
          q: `topic:${randomTopic} stars:>1000`,
          sort: "stars",
          order: "desc",
          per_page: 10
        },
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    );

    return response.data.items.map((repo: any) => ({
      sourceId: String(repo.id),
      source: "github",
      contentType: "repository",
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
      // Fetch from specific source with increased limit
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
        case "github":
          contents = await fetchGitHubContent();
          break;
      }
    } else {
      // Fetch from multiple sources in parallel and interleave results
      const fetchPromises = [
        fetchWikipediaContent(),
        fetchBlogContent(),
        fetchBookContent(),
        fetchTextbookContent(),
        fetchGitHubContent()
      ];

      const results = await Promise.all(fetchPromises);

      // Interleave results from different sources
      const maxLength = Math.max(...results.map(arr => arr.length));
      contents = [];

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