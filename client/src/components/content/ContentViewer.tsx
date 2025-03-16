import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ContentCard } from "./ContentCard";
import { AdPlaceholder } from "./AdPlaceholder";
import { type ContentType } from "@/types/content";
import { Skeleton } from "@/components/ui/skeleton";

type ContentViewerProps = {
  source?: string;
};

export function ContentViewer({ source }: ContentViewerProps) {
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { 
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error
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

  return (
    <div className="h-screen w-screen overflow-y-auto snap-y snap-mandatory">
      {data.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page.map((content: ContentType, index: number) => (
            <>
              <div key={content.id} className="snap-start h-screen w-screen">
                <ContentCard content={content} />
              </div>
              {(index + 1) % 5 === 0 && (
                <AdPlaceholder 
                  position={index} 
                  sourceType={content.contentType}
                />
              )}
            </>
          ))}
        </div>
      ))}
      <div ref={loadMoreRef} className="h-4" />
    </div>
  );
}