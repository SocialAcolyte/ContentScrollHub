import { SiWikipedia, SiArxiv, SiDevdotto } from "react-icons/si";
import { BookOpen, BookMarked, FileText, Globe, Search } from "lucide-react";
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
    icon: SiDevdotto,
    contentType: ContentType.BLOG_POST,
    isPremium: true
  },
  {
    id: "books",
    name: "Books",
    icon: BookOpen,
    contentType: ContentType.BOOK,
    isPremium: true
  },
  {
    id: "textbooks",
    name: "Textbooks",
    icon: BookMarked,
    contentType: ContentType.TEXTBOOK
  },
  {
    id: "arxiv",
    name: "ArXiv",
    icon: SiArxiv,
    contentType: ContentType.RESEARCH_PAPER,
    isPremium: true
  }
] as const;