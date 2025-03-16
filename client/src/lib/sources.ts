import { SiWikipedia, SiMedium, SiGithub } from "react-icons/si";
import { BookOpen, BookMarked, FileText } from "lucide-react";
import { ContentType } from "@shared/schema";

export const sources = [
  {
    id: "wikipedia",
    name: "Wikipedia",
    icon: SiWikipedia,
    contentType: ContentType.ARTICLE
  },
  {
    id: "blogs",
    name: "Blogs",
    icon: SiMedium,
    contentType: ContentType.BLOG_POST
  },
  {
    id: "books",
    name: "Books",
    icon: BookOpen,
    contentType: ContentType.BOOK
  },
  {
    id: "textbooks",
    name: "Textbooks",
    icon: BookMarked,
    contentType: ContentType.TEXTBOOK
  },
  {
    id: "github",
    name: "GitHub",
    icon: SiGithub,
    contentType: ContentType.REPOSITORY
  },
  {
    id: "arxiv",
    name: "arXiv",
    icon: FileText,
    contentType: ContentType.RESEARCH_PAPER
  }
] as const;