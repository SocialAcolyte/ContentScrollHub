import { SiWikipedia, SiGoodreads, SiGithub, SiMedium, SiKaggle } from "react-icons/si";
import { BookOpen, FileText, BookMarked, Newspaper } from "lucide-react";
import { ContentType } from "@shared/schema";

export const sources = [
  {
    id: "wikipedia",
    name: "Wikipedia",
    icon: SiWikipedia,
    contentType: ContentType.ARTICLE
  },
  {
    id: "goodreads",
    name: "Goodreads",
    icon: SiGoodreads,
    contentType: ContentType.BOOK
  },
  {
    id: "openstax",
    name: "OpenStax",
    icon: BookMarked,
    contentType: ContentType.TEXTBOOK
  },
  {
    id: "arxiv",
    name: "arXiv",
    icon: FileText,
    contentType: ContentType.RESEARCH_PAPER
  },
  {
    id: "github",
    name: "GitHub",
    icon: SiGithub,
    contentType: ContentType.REPOSITORY
  },
  {
    id: "medium",
    name: "Medium",
    icon: SiMedium,
    contentType: ContentType.BLOG_POST
  },
  {
    id: "kaggle",
    name: "Kaggle",
    icon: SiKaggle,
    contentType: ContentType.RESEARCH_PAPER
  },
  {
    id: "project_gutenberg",
    name: "Project Gutenberg",
    icon: BookOpen,
    contentType: ContentType.BOOK
  },
  {
    id: "dev_to",
    name: "DEV",
    icon: Newspaper,
    contentType: ContentType.BLOG_POST
  }
] as const;