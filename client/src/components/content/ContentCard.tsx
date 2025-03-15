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
      "relative w-full h-full overflow-hidden",
      "bg-black",
      className
    )}>
      {content.thumbnail ? (
        <img
          src={content.thumbnail}
          alt={content.title}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
          <span className="text-2xl text-white/80 font-medium max-w-[80%] text-center">
            {content.title}
          </span>
        </div>
      )}

      <ContentOverlay content={content} />
    </div>
  );
}