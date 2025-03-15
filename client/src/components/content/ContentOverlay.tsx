import { type ContentType } from "@/types/content";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, Bookmark, Crown } from "lucide-react";
import { sources } from "@/lib/sources";
import { useState, useEffect, useCallback } from "react";

type ContentOverlayProps = {
  content: ContentType;
  className?: string;
};

export function ContentOverlay({ content, className }: ContentOverlayProps) {
  const source = sources.find(s => s.id === content.source);
  const Icon = source?.icon;
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const isPremium = content.contentType === "research_paper" || 
                   content.contentType === "textbook" || 
                   content.contentType === "blog_post";

  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setIsLiked(prev => !prev);
    }
    setLastTap(now);
  }, [lastTap]);

  const handleClick = (e: React.MouseEvent) => {
    // Check if it's not a mobile device (no touch events)
    if (!('ontouchstart' in window)) {
      window.open(content.url, '_blank');
    }
    e.preventDefault();
  };

  return (
    <div 
      className={cn(
        "absolute inset-0",
        "bg-gradient-to-t from-black via-black/60 to-transparent",
        className
      )}
      onClick={handleClick}
      onTouchEnd={handleTap}
    >
      {/* Top section with source info */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-white" />}
          <Badge variant="outline" className="text-white border-white">
            {source?.name}
            {isPremium && (
              <Crown className="h-3 w-3 ml-1 inline-block text-yellow-400" />
            )}
          </Badge>
        </div>
      </div>

      {/* Content info in the middle */}
      <div className="absolute bottom-16 left-0 right-0 p-4">
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-white line-clamp-2">
          {content.title}
        </h2>
        {content.excerpt && (
          <p className="text-sm text-gray-200 line-clamp-2">
            {content.excerpt}
          </p>
        )}
      </div>

      {/* Action buttons at bottom right */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm",
            "text-white hover:text-primary hover:bg-white/20",
            isLiked && "text-red-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
        >
          <Heart className={cn(
            "h-6 w-6 transition-colors",
            isLiked && "fill-current"
          )} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm",
            "text-white hover:text-primary hover:bg-white/20",
            isBookmarked && "text-yellow-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsBookmarked(!isBookmarked);
          }}
        >
          <Bookmark className={cn(
            "h-6 w-6 transition-colors",
            isBookmarked && "fill-current"
          )} />
        </Button>
      </div>
    </div>
  );
}