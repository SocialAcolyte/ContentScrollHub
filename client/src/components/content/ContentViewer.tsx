import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ContentCard } from "./ContentCard";
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
      const data = await response.json() as ContentType[];
      return data;
    },
    getNextPageParam: (lastPage: ContentType[], pages: ContentType[][]) => {
      return lastPage.length === 0 ? undefined : pages.length + 1;
    },
  });

  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
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
        No content available
      </div>
    );
  }

  return (
    <div className="h-screen w-screen snap-y snap-mandatory overflow-y-scroll">
      {data.pages.map((page, i) => (
        <div key={i}>
          {page.map((content: ContentType) => (
            <div key={content.id} className="snap-start h-screen w-screen">
              <ContentCard content={content} />
            </div>
          ))}
        </div>
      ))}
      <div ref={loadMoreRef} className="h-4" />
    </div>
  );
}