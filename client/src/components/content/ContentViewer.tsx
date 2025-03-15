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
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        ...(source && { source })
      });
      return fetch(`/api/contents?${params}`).then(res => res.json());
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
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-[9/16]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-destructive">
        Error: {error instanceof Error ? error.message : "Failed to load content"}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {data.pages.map((page, i) => (
        <div key={i} className="space-y-4">
          {page.map((content: ContentType) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ))}
      <div ref={loadMoreRef} className="h-4" />
    </div>
  );
}
