import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sources } from "@/lib/sources";
import { cn } from "@/lib/utils";
import { Grid3X3Icon } from "lucide-react";

type SourceSelectorProps = {
  selectedSource?: string;
  onSourceChange: (source: string | undefined) => void;
};

export function SourceSelector({ selectedSource, onSourceChange }: SourceSelectorProps) {
  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ScrollArea className="w-full">
        <div className="flex space-x-2 p-4 items-center">
          <Button
            variant={!selectedSource ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex items-center space-x-2",
              !selectedSource && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSourceChange(undefined)}
          >
            <Grid3X3Icon className="h-4 w-4" />
            <span>All Sources</span>
          </Button>

          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <Button
                key={source.id}
                variant={selectedSource === source.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex items-center space-x-2 transition-all",
                  selectedSource === source.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => onSourceChange(source.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{source.name}</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}