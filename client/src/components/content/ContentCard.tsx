import { useState, useEffect } from "react";
import { type ContentType } from "@/types/content";
import { ContentOverlay } from "./ContentOverlay";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

type ContentCardProps = {
  content: ContentType;
  className?: string;
};

export function ContentCard({ content, className }: ContentCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(content.thumbnail || null);
  
  // Reset state when content changes
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
    setImageSrc(content.thumbnail || null);
  }, [content.id, content.thumbnail]);

  // Generate a gradient background based on content type
  const getGradientByType = (type: string): string => {
    const gradients: Record<string, string> = {
      "article": "from-blue-900/70 to-black",
      "book": "from-amber-900/70 to-black",
      "textbook": "from-green-900/70 to-black",
      "research_paper": "from-purple-900/70 to-black",
      "blog_post": "from-indigo-900/70 to-black"
    };
    
    return gradients[type] || "from-gray-900 to-black";
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
    setImageSrc(null);
  };

  return (
    <div className={cn(
      "relative w-full h-full overflow-hidden bg-black",
      className
    )}>
      {/* Gradient Background Layer - Always Present */}
      <div 
        className={cn(
          "absolute inset-0 w-full h-full bg-gradient-to-b",
          getGradientByType(content.contentType)
        )}
      />
      
      {/* Image Layer */}
      {imageSrc && !imageError && (
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader className="h-8 w-8 text-white/70 animate-spin" />
            </div>
          )}
          <img
            src={imageSrc}
            alt={content.title}
            className={cn(
              "w-full h-full object-cover md:object-contain",
              "transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      )}

      {/* Text Fallback when no image or error */}
      {(!imageSrc || imageError) && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <span className="text-2xl sm:text-3xl md:text-4xl text-white/90 font-medium max-w-[90%] text-center leading-snug">
            {content.title}
          </span>
        </div>
      )}

      {/* Overlay with content info and interactions */}
      <ContentOverlay content={content} />
    </div>
  );
}