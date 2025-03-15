import { type ContentType } from "@/types/content";
import { ContentOverlay } from "./ContentOverlay";
import { cn } from "@/lib/utils";

type ContentCardProps = {
  content: ContentType;
  className?: string;
};

export function ContentCard({ content, className }: ContentCardProps) {
  return (
    <div className={cn(
      "relative w-full aspect-[9/16] overflow-hidden",
      "bg-muted rounded-lg",
      className
    )}>
      {content.thumbnail ? (
        <img
          src={content.thumbnail}
          alt={content.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-muted-foreground">No preview available</span>
        </div>
      )}
      
      <ContentOverlay content={content} />
    </div>
  );
}
