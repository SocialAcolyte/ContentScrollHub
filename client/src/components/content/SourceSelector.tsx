import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sources } from "@/lib/sources";
import { cn } from "@/lib/utils";
import { Grid3X3Icon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

type SourceSelectorProps = {
  selectedSource?: string;
  onSourceChange: (source: string | undefined) => void;
};

export function SourceSelector({ selectedSource, onSourceChange }: SourceSelectorProps) {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    if (selectedSource) {
      await fetch(`/api/refresh/${selectedSource}`);
    }
    await queryClient.invalidateQueries({ queryKey: ["/api/contents"] });
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-2 p-3 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant={!selectedSource ? "default" : "ghost"}
            size="sm"
            className={cn(
              "flex items-center gap-1 min-w-fit text-sm",
              !selectedSource && "bg-primary text-primary-foreground",
              "text-white hover:bg-white/20"
            )}
            onClick={() => onSourceChange(undefined)}
          >
            <Grid3X3Icon className="h-4 w-4" />
            <span className="hidden xs:inline">All</span>
          </Button>

          {sources.map((source) => {
            const Icon = source.icon;
            const isSelected = selectedSource === source.id;
            return (
              <div key={source.id} className="relative group">
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-1 min-w-fit text-sm transition-all",
                    isSelected ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/20"
                  )}
                  onClick={() => onSourceChange(source.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xs:inline">{source.name}</span>
                </Button>
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {source.contentType}
                </Badge>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}