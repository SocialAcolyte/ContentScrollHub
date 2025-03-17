import { useState, useEffect, useRef } from "react";
import { type ContentType } from "@/types/content";
import { ContentOverlay } from "./ContentOverlay";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

type ContentCardProps = {
  content: ContentType;
  className?: string;
};

export function ContentCard({ content, className }: ContentCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(content.thumbnail || null);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Reset state when content changes
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
    setImageSrc(content.thumbnail || null);
    
    // Small delay before showing the content for a smooth animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => {
      clearTimeout(timer);
      setIsVisible(false);
    };
  }, [content.id, content.thumbnail]);

  // Generate a gradient background based on content type
  const getGradientByType = (type: string): string => {
    const gradients: Record<string, string> = {
      "article": "from-blue-900/80 via-blue-800/50 to-black",
      "book": "from-amber-900/80 via-amber-800/50 to-black",
      "textbook": "from-green-900/80 via-green-800/50 to-black",
      "research_paper": "from-purple-900/80 via-purple-800/50 to-black",
      "blog_post": "from-indigo-900/80 via-indigo-800/50 to-black",
      "magazine": "from-rose-900/80 via-rose-800/50 to-black",
      "news": "from-sky-900/80 via-sky-800/50 to-black"
    };
    
    return gradients[type] || "from-gray-900/80 via-gray-800/50 to-black";
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
    <div 
      ref={cardRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-black",
        "transition-opacity duration-300 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 animate-fade-in">
              <Loader2 className="h-8 w-8 text-white/70 animate-spin mb-2" />
              <span className="text-sm text-white/70">Loading content...</span>
            </div>
          )}
          <img
            src={imageSrc}
            alt={content.title}
            className={cn(
              "w-full h-full object-cover",
              "transition-all duration-500 ease-in-out",
              isLoading ? "opacity-0 scale-105 blur-md" : "opacity-100 scale-100 blur-0"
            )}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Optional image overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Text Fallback when no image or error */}
      {(!imageSrc || imageError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 animate-fade-in">
          {imageError && (
            <div className="mb-6 flex flex-col items-center">
              <AlertCircle className="h-10 w-10 text-white/60 mb-2" />
              <span className="text-sm text-white/70">Image not available</span>
            </div>
          )}
          <span className="text-2xl sm:text-3xl md:text-4xl text-white font-medium max-w-[90%] text-center leading-snug text-shadow-md">
            {content.title}
          </span>
        </div>
      )}

      {/* Overlay with content info and interactions */}
      <ContentOverlay content={content} />
    </div>
  );
}