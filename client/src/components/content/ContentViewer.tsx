import { useEffect, useRef, useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ContentCard } from "./ContentCard";
import { AdPlaceholder } from "./AdPlaceholder";
import { type ContentType } from "@/types/content";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpCircle, RefreshCw, RotateCcw, Loader2, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type ContentViewerProps = {
  source?: string;
};

export function ContentViewer({ source }: ContentViewerProps) {
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwipeRefreshing, setIsSwipeRefreshing] = useState(false);
  const isMobile = useIsMobile();
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

  // Infinite scroll loading
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

  // Scroll watcher for top button visibility and current index tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const scrollY = scrollContainerRef.current.scrollTop;
      const viewportHeight = window.innerHeight;
      
      // Show/hide scroll to top button
      setShowScrollTop(scrollY > viewportHeight * 1.5);
      
      // Track current content index for scroll snap navigation
      const newIndex = Math.floor(scrollY / viewportHeight);
      setCurrentIndex(newIndex);
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Mobile touch handling for pull-to-refresh and swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchDiff = touchEndY - touchStartY;
    
    // Pull down to refresh (when at the top)
    if (currentIndex === 0 && touchDiff > 100) {
      setIsSwipeRefreshing(true);
      try {
        await refetch();
        toast({
          title: "Content refreshed",
          description: "Fresh content loaded",
        });
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsSwipeRefreshing(false);
      }
    }
  }, [touchStartY, currentIndex, refetch, toast]);

  // Scroll to top function
  const handleScrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Content refreshed",
        description: `Fresh content from ${source || 'all sources'} loaded`,
      });
    } catch (error) {
      console.error("Manual refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, source, toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-white text-lg">Loading amazing content...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-black/90 p-4">
        <div className="text-destructive text-center max-w-md">
          <p className="text-xl font-bold mb-2">Something went wrong</p>
          <p className="text-gray-400 mb-4">{error instanceof Error ? error.message : "Failed to load content"}</p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="bg-primary/20 hover:bg-primary/40 border-primary/40"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No content state
  if (!data || data.pages.every(page => page.length === 0)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-black/90 p-4">
        <div className="text-center max-w-md">
          <p className="text-xl font-bold text-white mb-2">No content available</p>
          <p className="text-gray-400 mb-4">Try selecting a different source or check back later</p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="bg-primary/20 hover:bg-primary/40 border-primary/40"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
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
      className="h-screen w-screen overflow-y-auto snap-y snap-mandatory no-scrollbar bg-black"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Pull to refresh indicator (mobile only) */}
      {isSwipeRefreshing && (
        <div className="fixed top-0 left-0 right-0 flex justify-center py-4 bg-gradient-to-b from-primary/20 to-transparent z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
            <span className="text-white text-sm">Refreshing...</span>
          </div>
        </div>
      )}
      
      {/* Refresh button */}
      <Button 
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="fixed top-20 right-4 z-50 bg-black/50 hover:bg-black/80 text-white p-2 h-10 w-10 rounded-full shadow-lg"
        size="icon"
        variant="outline"
        aria-label="Refresh content"
      >
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <RefreshCw className="h-5 w-5" />
        )}
      </Button>
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <Button 
          onClick={handleScrollToTop}
          className="fixed bottom-20 right-4 z-50 bg-black/50 hover:bg-black/80 text-white p-2 h-10 w-10 rounded-full shadow-lg"
          size="icon"
          variant="outline"
          aria-label="Scroll to top"
        >
          <ArrowUpCircle className="h-5 w-5" />
        </Button>
      )}

      {/* Scroll hint for desktop */}
      {!isMobile && currentIndex === 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce opacity-70">
          <div className="flex flex-col items-center gap-1">
            <ChevronDown className="h-6 w-6 text-white" />
            <span className="text-xs text-white">Scroll for more</span>
          </div>
        </div>
      )}

      {contentItems}
      
      <div ref={loadMoreRef} className="h-4" />
    </div>
  );
}