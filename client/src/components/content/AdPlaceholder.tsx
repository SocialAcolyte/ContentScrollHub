import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type AdPlaceholderProps = {
  position: number;
  sourceType?: string;
};

export function AdPlaceholder({ position, sourceType }: AdPlaceholderProps) {
  const [adType, setAdType] = useState<string>("general");

  useEffect(() => {
    // In a real implementation, this would fetch relevant ad based on source type
    if (sourceType) {
      setAdType(sourceType);
    }
  }, [sourceType]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black/80 snap-start">
      <div className="bg-black/40 backdrop-blur-sm p-8 rounded-lg text-center">
        <Badge variant="outline" className="mb-4">Advertisement</Badge>
        <h2 className="text-2xl font-bold text-white mb-2">
          {position % 2 === 0 ? "Premium Content Ahead" : "Sponsored Content"}
        </h2>
        <p className="text-gray-400">
          This is a placeholder for {adType} advertisements
        </p>
      </div>
    </div>
  );
}
