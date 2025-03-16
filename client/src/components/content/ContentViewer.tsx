import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ContentCard } from "./ContentCard";
import { AdPlaceholder } from "./AdPlaceholder";
import { type ContentType } from "@/types/content";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpCircle, RefreshCw } from "lucide-react";

type ContentViewerProps = {
  source?: string;
};

export function ContentViewer({ source }: ContentViewerProps) {
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { toast } = useToast();

  const { 
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ["/api/contents", source],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        ...(source && { source })
      });
      const response = await fetch(`/api/contents?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json() as ContentType[];
      return data;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 0 ? undefined : pages.length + 1;
    },
  });

  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchNextPage, hasNextPage]);

  // Scroll top visibility logic
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const scrollY = scrollContainerRef.current.scrollTop;
      setShowScrollTop(scrollY > window.innerHeight * 1.5);
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const handleScrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Content refreshed",
      description: `Fresh content from ${source || 'all sources'} loaded`,
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center text-destructive">
        Error: {error instanceof Error ? error.message : "Failed to load content"}
      </div>
    );
  }

  if (!data || data.pages.every(page => page.length === 0)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center text-muted-foreground">
        No content available for this source
      </div>
    );
  }

  // Create a flattened array of content items mixed with ads
  const contentItems: JSX.Element[] = [];
  
  data.pages.forEach((page, pageIndex) => {
    page.forEach((content: ContentType, index: number) => {
      // Add content card
      contentItems.push(
        <div 
          key={`content-${content.id}-${pageIndex}-${index}`} 
          className="snap-start h-screen w-screen"
        >
          <ContentCard content={content} />
        </div>
      );
      
      // Add advertisement after every 5th item
      if ((index + 1) % 5 === 0) {
        contentItems.push(
          <div 
            key={`ad-${content.id}-${pageIndex}-${index}`} 
            className="snap-start h-screen w-screen"
          >
            <AdPlaceholder 
              position={index} 
              sourceType={content.contentType}
            />
          </div>
        );
      }
    });
  });

  return (
    <div 
      ref={scrollContainerRef}
      className="h-screen w-screen overflow-y-auto snap-y snap-mandatory"
    >
      {/* Refresh button */}
      <button 
        onClick={handleRefresh}
        className="fixed top-20 right-4 z-50 bg-primary/80 hover:bg-primary text-white p-2 rounded-full shadow-lg"
        aria-label="Refresh content"
      >
        <RefreshCw className="h-6 w-6" />
      </button>
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <button 
          onClick={handleScrollToTop}
          className="fixed bottom-20 right-4 z-50 bg-primary/80 hover:bg-primary text-white p-2 rounded-full shadow-lg"
          aria-label="Scroll to top"
        >
          <ArrowUpCircle className="h-6 w-6" />
        </button>
      )}

      {contentItems}
      <div ref={loadMoreRef} className="h-4" />
    </div>
  );
}