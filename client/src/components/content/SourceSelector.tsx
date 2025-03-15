import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sources } from "@/lib/sources";
import { cn } from "@/lib/utils";

type SourceSelectorProps = {
  selectedSource?: string;
  onSourceChange: (source: string) => void;
};

export function SourceSelector({ selectedSource, onSourceChange }: SourceSelectorProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex space-x-2 p-4">
        {sources.map((source) => {
          const Icon = source.icon;
          return (
            <Button
              key={source.id}
              variant={selectedSource === source.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex items-center space-x-2",
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
  );
}
