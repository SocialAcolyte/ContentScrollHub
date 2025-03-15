import { SiWikipedia, SiGoodreads, SiGithub } from "react-icons/si";
import { BookOpen, FileText } from "lucide-react";

export const sources = [
  {
    id: "wikipedia",
    name: "Wikipedia",
    icon: SiWikipedia
  },
  {
    id: "goodreads",
    name: "Goodreads",
    icon: SiGoodreads
  },
  {
    id: "openlibrary",
    name: "OpenLibrary",
    icon: BookOpen
  },
  {
    id: "arxiv",
    name: "arXiv",
    icon: FileText
  },
  {
    id: "github",
    name: "GitHub",
    icon: SiGithub
  }
] as const;
