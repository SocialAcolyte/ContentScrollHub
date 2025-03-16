import { SiWikipedia } from "react-icons/si";
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
    id: "articles",
    name: "Articles",
    icon: FileText,
    contentType: ContentType.ARTICLE
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
  }
] as const;