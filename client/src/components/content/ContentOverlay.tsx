import { type ContentType } from "@/types/content";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { sources } from "@/lib/sources";

type ContentOverlayProps = {
  content: ContentType;
  className?: string;
};

export function ContentOverlay({ content, className }: ContentOverlayProps) {
  const source = sources.find(s => s.id === content.source);
  const Icon = source?.icon;

  return (
    <div className={cn(
      "absolute bottom-0 left-0 right-0",
      "bg-gradient-to-t from-black/80 to-transparent",
      "p-6 text-white",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-5 w-5" />}
        <Badge variant="outline" className="text-white border-white">
          {source?.name}
        </Badge>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
      
      {content.excerpt && (
        <p className="text-sm text-gray-200 line-clamp-3 mb-4">
          {content.excerpt}
        </p>
      )}

      <a 
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-white hover:underline"
      >
        <ExternalLink className="h-4 w-4 mr-1" />
        View Original
      </a>
    </div>
  );
}
