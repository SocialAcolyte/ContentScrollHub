import { useState } from "react";
import { SourceSelector } from "@/components/content/SourceSelector";
import { ContentViewer } from "@/components/content/ContentViewer";

export default function Home() {
  const [selectedSource, setSelectedSource] = useState<string>();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-10">
        <SourceSelector 
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
        />
      </header>

      <main className="pt-[72px] pb-8 max-w-2xl mx-auto px-4">
        <ContentViewer source={selectedSource} />
      </main>
    </div>
  );
}