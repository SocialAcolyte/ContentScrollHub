import { useState } from "react";
import { SourceSelector } from "@/components/content/SourceSelector";
import { ContentViewer } from "@/components/content/ContentViewer";

export default function Home() {
  const [selectedSource, setSelectedSource] = useState<string>();

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur">
        <SourceSelector 
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
        />
      </div>
      
      <main className="pt-20 max-w-2xl mx-auto">
        <ContentViewer source={selectedSource} />
      </main>
    </div>
  );
}
