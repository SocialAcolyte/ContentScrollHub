import { useState } from "react";
import { SourceSelector } from "@/components/content/SourceSelector";
import { ContentViewer } from "@/components/content/ContentViewer";

export default function Home() {
  const [selectedSource, setSelectedSource] = useState<string>();

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed top bar with source selector */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <SourceSelector 
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
        />
      </header>

      {/* Full-screen content area */}
      <main className="h-screen w-screen">
        <ContentViewer source={selectedSource} />
      </main>
    </div>
  );
}