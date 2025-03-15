import { type ContentType } from "@/types/content";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, Bookmark } from "lucide-react";
import { sources } from "@/lib/sources";
import { useState } from "react";

type ContentOverlayProps = {
  content: ContentType;
  className?: string;
};

export function ContentOverlay({ content, className }: ContentOverlayProps) {
  const source = sources.find(s => s.id === content.source);
  const Icon = source?.icon;
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className={cn(
      "absolute inset-0",
      "bg-gradient-to-t from-black/90 via-black/60 to-transparent",
      "p-4 md:p-6 text-white",
      "flex flex-col justify-between",
      className
    )}>
      {/* Top section with source info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 md:h-5 md:w-5" />}
          <Badge variant="outline" className="text-white border-white text-xs md:text-sm">
            {source?.name}
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:text-primary hover:bg-white/20"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={cn(
              "h-5 w-5 transition-colors",
              isLiked && "fill-current text-red-500"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:text-primary hover:bg-white/20"
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark className={cn(
              "h-5 w-5 transition-colors",
              isBookmarked && "fill-current text-yellow-500"
            )} />
          </Button>
        </div>
      </div>

      {/* Bottom section with content info */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">{content.title}</h2>

        {content.excerpt && (
          <p className="text-sm text-gray-200 line-clamp-2 md:line-clamp-3 mb-3">
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
    </div>
  );
}