import { type ContentType } from "@/types/content";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Share2, Crown, AlertCircle, Heart, EyeOff, Flag, 
  ExternalLink, MoreVertical, BookmarkPlus, Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { sources } from "@/lib/sources";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";

// Animation when liking content
const HeartAnimation = ({ isVisible, x, y }: { isVisible: boolean, x: number, y: number }) => {
  if (!isVisible) return null;
  
  return (
    <div 
      className="absolute animate-float-up pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      <Heart className="h-16 w-16 text-red-500 fill-current animate-pulse" />
    </div>
  );
};

type ContentOverlayProps = {
  content: ContentType;
  className?: string;
};

export function ContentOverlay({ content, className }: ContentOverlayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const source = sources.find(s => s.id === content.source);
  const Icon = source?.icon;
  
  const [isLiked, setIsLiked] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [animationPosition, setAnimationPosition] = useState({ x: 0, y: 0 });
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  
  // Determine if content is premium
  const isPremium = content.contentType === "research_paper" || 
                   content.contentType === "textbook" || 
                   content.contentType === "blog_post";
  
  // Check premium access
  useEffect(() => {
    // User has premium access if they are a premium user
    if (user?.isPremium) {
      setHasPremiumAccess(true);
    } else {
      setHasPremiumAccess(false);
    }
  }, [user]);
                   
  // Check if content is in user's liked content or in localStorage
  useEffect(() => {
    // Reset states when content changes
    setIsLiked(false);
    setIsHidden(false);
    
    // First check localStorage (for non-logged in users)
    const liked = localStorage.getItem(`liked_${content.id}`);
    if (liked) {
      setIsLiked(true);
      return;
    }
    
    // Then check user data if user is logged in
    if (user?.likedContent && Array.isArray(user.likedContent)) {
      if (user.likedContent.includes(content.id)) {
        setIsLiked(true);
      }
    }
    
    // Check if content is hidden
    const hidden = localStorage.getItem(`hidden_${content.id}`);
    if (hidden) {
      setIsHidden(true);
    }
    
    // Check user's hidden content if logged in
    if (user?.hiddenContent && Array.isArray(user.hiddenContent)) {
      if (user.hiddenContent.includes(content.id)) {
        setIsHidden(true);
      }
    }
  }, [content.id, user]);
  
  // Handle heart animation
  const triggerHeartAnimation = (x: number, y: number) => {
    setAnimationPosition({ x, y });
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
  };
  
  // Handle liking content
  const handleLike = useCallback(async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      
      // If this is a mouse event, show animation at click position
      if ('clientX' in e) {
        const rect = overlayRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          triggerHeartAnimation(x, y);
        }
      } else {
        // For touch events, use the center of the element
        const rect = overlayRef.current?.getBoundingClientRect();
        if (rect) {
          triggerHeartAnimation(rect.width / 2, rect.height / 2);
        }
      }
    }
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Haptic feedback on mobile if available
    if (newLikedState && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    // Update like in persistent storage
    if (user) {
      // If logged in, update user account
      try {
        await apiRequest({
          url: `/api/user/like/${content.id}`,
          method: newLikedState ? 'POST' : 'DELETE',
          data: {}
        });
        
        // Update the content's like count
        await apiRequest({
          url: `/api/contents/${content.id}/like`,
          method: newLikedState ? 'POST' : 'DELETE',
          data: {}
        });
      } catch (error) {
        console.error('Error updating like status:', error);
        // Revert UI state if API call fails
        setIsLiked(!newLikedState);
        toast({
          title: "Error",
          description: "Failed to update like status",
          variant: "destructive"
        });
      }
    } else {
      // If not logged in, use localStorage
      if (newLikedState) {
        localStorage.setItem(`liked_${content.id}`, 'true');
      } else {
        localStorage.removeItem(`liked_${content.id}`);
      }
    }
  }, [isLiked, content.id, user, toast]);

  // Handle touch events for mobile swipe/tap detection
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Double tap detection
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - trigger like
      handleLike(e);
      e.preventDefault();
    }
    setLastTap(now);
    
    // Swipe to next detection will be handled by ContentViewer
  };

  // Handle clicking on content to open original source
  const handleContentClick = (e: React.MouseEvent) => {
    // Only open on desktop - mobile uses swipe gestures
    if (!isMobile) {
      // For premium content, check if user has access
      if (isPremium && !hasPremiumAccess) {
        e.preventDefault();
        toast({
          title: "Premium Content",
          description: "Subscribe to access premium content",
          variant: "default"
        });
        return;
      }
      
      window.open(content.url, '_blank');
    }
  };

  // Handle sharing content
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: content.title,
          text: content.excerpt || content.title,
          url: content.url,
        });
        
        // Update share count
        try {
          await apiRequest({
            url: `/api/contents/${content.id}/share`,
            method: 'POST',
            data: {}
          });
        } catch (error) {
          console.error('Error updating share count:', error);
        }
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(content.url);
        toast({
          title: "Link copied",
          description: "Content link copied to clipboard",
        });
        
        // Still update share count
        try {
          await apiRequest({
            url: `/api/contents/${content.id}/share`,
            method: 'POST',
            data: {}
          });
        } catch (error) {
          console.error('Error updating share count:', error);
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Sharing failed",
        description: "Could not share this content",
        variant: "destructive"
      });
    }
  };
  
  // Handle reporting content
  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest({
        url: `/api/contents/${content.id}/report`,
        method: 'POST',
        data: {}
      });
      
      toast({
        title: "Content reported",
        description: "Thank you for helping to improve ThinkTok",
      });
    } catch (error) {
      console.error('Error reporting content:', error);
      toast({
        title: "Error",
        description: "Failed to report content",
        variant: "destructive"
      });
    }
  };
  
  // Handle saving content
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save content to your collection",
      });
      return;
    }
    
    toast({
      title: "Content saved",
      description: "Added to your saved items"
    });
  };
  
  // Handle hiding content
  const handleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHidden(true);
    
    if (user) {
      // If logged in, update user account
      try {
        await apiRequest({
          url: `/api/user/hide/${content.id}`,
          method: 'POST',
          data: {}
        });
      } catch (error) {
        console.error('Error hiding content:', error);
        toast({
          title: "Error",
          description: "Failed to hide content",
          variant: "destructive"
        });
        setIsHidden(false);
      }
    } else {
      // If not logged in, use localStorage
      localStorage.setItem(`hidden_${content.id}`, 'true');
    }
  };
  
  // If content is hidden, don't render it
  if (isHidden) {
    return null;
  }

  return (
    <div 
      ref={overlayRef}
      className={cn(
        "absolute inset-0",
        "bg-gradient-to-t from-black via-black/60 to-transparent",
        className
      )}
      onClick={handleContentClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Heart animation */}
      <HeartAnimation 
        isVisible={showHeartAnimation} 
        x={animationPosition.x} 
        y={animationPosition.y} 
      />
      
      {/* Premium content banner */}
      {isPremium && !hasPremiumAccess && (
        <div className="absolute top-14 left-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 py-1 px-4 flex items-center justify-center z-10">
          <Sparkles className="h-4 w-4 text-white mr-2" />
          <span className="text-xs font-semibold text-white">Premium Content</span>
        </div>
      )}
      
      {/* Top section with source info */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-white" />}
          <Badge variant="outline" className="text-white border-white/40 bg-black/30 backdrop-blur-sm">
            {source?.name}
            {isPremium && (
              <Crown className="h-3.5 w-3.5 ml-1 inline-block text-yellow-400" />
            )}
          </Badge>
        </div>
        
        {/* Top right actions */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-white/10 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            window.open(content.url, '_blank');
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Content info in the middle/bottom */}
      <div className="absolute bottom-16 left-0 right-0 p-4 text-shadow-lg">
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-white line-clamp-2">
          {content.title}
        </h2>
        {content.excerpt && (
          <p className="text-sm md:text-base text-gray-200 line-clamp-3 md:line-clamp-2">
            {content.excerpt}
          </p>
        )}
      </div>

      {/* Action buttons at bottom right */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-3">
        {/* Like button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/40 backdrop-blur-sm",
            "hover:bg-white/10 transition-all",
            isLiked ? "text-red-500" : "text-white hover:text-white"
          )}
          onClick={(e) => handleLike(e as React.MouseEvent)}
        >
          <Heart className={cn(
            "h-5 w-5 sm:h-6 sm:w-6 transition-all",
            isLiked && "fill-current animate-pulse"
          )} />
          <span className="sr-only">Like</span>
        </Button>

        {/* Share button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:text-white hover:bg-white/10"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="sr-only">Share</span>
        </Button>

        {/* Save button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:text-white hover:bg-white/10"
          onClick={handleSave}
        >
          <BookmarkPlus className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="sr-only">Save</span>
        </Button>

        {/* More options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:text-white hover:bg-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="h-4 w-4 mr-2" />
              Report Content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHide}>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide this content
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              if (isPremium && !hasPremiumAccess) {
                toast({
                  title: "Premium Content",
                  description: "Subscribe to unlock premium content",
                });
                return;
              }
              window.open(content.url, '_blank');
            }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Source
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile swipe hint (only for initial interactions) */}
      {isMobile && (
        <div className="absolute bottom-4 left-4 text-xs text-white/70 pointer-events-none">
          <span className="animate-pulse">Swipe for next • Double-tap to like</span>
        </div>
      )}
    </div>
  );
}