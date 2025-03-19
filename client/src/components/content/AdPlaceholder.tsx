import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

// Sample ad categories
const AD_CATEGORIES = ["books", "technology", "education", "entertainment", "lifestyle"];

// Sample ad data structure
type Advertisement = {
  id: string;
  title: string;
  description: string;
  cta: string;
  url: string;
  image?: string;
  category: string;
};

// Ad sample data would normally be fetched from backend
const sampleAds: Advertisement[] = [
  {
    id: "ad1",
    title: "Discover Premium Books",
    description: "Unlock exclusive access to thousands of bestsellers and new releases.",
    cta: "Try Premium",
    url: "#premium-books",
    category: "books",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=687&auto=format&fit=crop"
  },
  {
    id: "ad2",
    title: "Explore Tech Articles",
    description: "Stay up-to-date with the latest in technology and development.",
    cta: "Explore Now",
    url: "#tech-articles",
    category: "technology"
  },
  {
    id: "ad3",
    title: "Advanced Learning Materials",
    description: "Ready to showcase your brand? Advertise with us and reach our engaged audience.",
    cta: "Become an Advertiser",
    url: "/advertiser-signup",
    category: "education"
  }
];

type AdPlaceholderProps = {
  position: number;
  sourceType?: string;
};

export function AdPlaceholder({ position, sourceType }: AdPlaceholderProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [adType, setAdType] = useState<string>("general");
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Determine relevant ad type based on content type
  useEffect(() => {
    if (sourceType) {
      // Map content types to ad categories
      const categoryMap: Record<string, string> = {
        "book": "books",
        "article": "education",
        "blog_post": "technology",
        "research_paper": "education",
        "textbook": "education"
      };
      
      setAdType(categoryMap[sourceType] || "general");
    }
  }, [sourceType]);

  // Select an advertisement based on position and type
  useEffect(() => {
    // In a real implementation, this would fetch from an ad service
    // Here we're just cycling through sample ads
    const relevantAds = sourceType 
      ? sampleAds.filter(ad => ad.category === adType)
      : sampleAds;
      
    if (relevantAds.length > 0) {
      const adIndex = position % relevantAds.length;
      setCurrentAd(relevantAds[adIndex]);
    } else {
      // Fallback to any ad if no relevant ones found
      const adIndex = position % sampleAds.length;
      setCurrentAd(sampleAds[adIndex]);
    }
  }, [position, adType, sourceType]);

  // Skip ads for premium users
  if (user?.isPremium) {
    return null;
  }

  // Skip if ad was dismissed
  if (dismissed) {
    return null;
  }

  // Loading state or no ad available
  if (!currentAd) {
    return null;
  }

  return (
    <div 
      className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-black/90 to-black snap-start relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Button 
        variant="ghost" 
        size="icon"
        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-black/40 z-10"
        onClick={() => setDismissed(true)}
      >
        <X className="h-5 w-5" />
      </Button>

      <div 
        className="relative max-w-md w-full mx-4 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-white/10 overflow-hidden"
        style={{ 
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Badge variant="outline" className="mb-2 absolute top-3 right-3 bg-black/40">
          Sponsored
        </Badge>

        {currentAd.image && (
          <div className="w-full h-40 overflow-hidden rounded-lg mb-4">
            <img 
              src={currentAd.image} 
              alt={currentAd.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
          {currentAd.title}
        </h2>
        
        <p className="text-gray-300 mb-4 text-sm md:text-base">
          {currentAd.description}
        </p>
        
        <div className="flex justify-between items-center">
          <Button 
            variant="default" 
            onClick={() => {
              // Use wouter navigation for internal routes, open external URLs in new tab
              if (currentAd.url.startsWith('/')) {
                setLocation(currentAd.url);
              } else {
                window.open(currentAd.url, "_blank");
              }
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {currentAd.cta}
            {isMobile ? <ArrowRight className="ml-2 h-4 w-4" /> : <ExternalLink className="ml-2 h-4 w-4" />}
          </Button>
          
          {isHovering && !isMobile && (
            <span className="text-xs text-gray-400 animate-fade-in">
              Click anywhere to continue
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
