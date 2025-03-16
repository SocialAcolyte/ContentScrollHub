import { type ContentType } from "@/types/content";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Crown, AlertCircle, Heart, EyeOff, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sources } from "@/lib/sources";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ContentOverlayProps = {
  content: ContentType;
  className?: string;
};

export function ContentOverlay({ content, className }: ContentOverlayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const source = sources.find(s => s.id === content.source);
  const Icon = source?.icon;
  
  const [isLiked, setIsLiked] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  
  const isPremium = content.contentType === "research_paper" || 
                   content.contentType === "textbook" || 
                   content.contentType === "blog_post";
                   
  // Check if content is in user's liked content or in localStorage
  useEffect(() => {
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
  
  // Handle liking content
  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
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

  // Handle double tap to like on mobile
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - trigger like
      handleLike({ stopPropagation: () => {} } as React.MouseEvent);
    }
    setLastTap(now);
  }, [lastTap, handleLike]);

  // Handle clicking on content to open original source
  const handleClick = (e: React.MouseEvent) => {
    // Check if it's not a mobile device (no touch events)
    if (!('ontouchstart' in window)) {
      window.open(content.url, '_blank');
    }
    e.preventDefault();
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
      className={cn(
        "absolute inset-0",
        "bg-gradient-to-t from-black via-black/60 to-transparent",
        className
      )}
      onClick={handleClick}
      onTouchEnd={handleTap}
    >
      {/* Top section with source info */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-white" />}
          <Badge variant="outline" className="text-white border-white">
            {source?.name}
            {isPremium && (
              <Crown className="h-3 w-3 ml-1 inline-block text-yellow-400" />
            )}
          </Badge>
        </div>
        
        {/* Search Bar - TODO: Implement search */}
        <div className="hidden md:block">
          {/* Will be implemented in another component */}
        </div>
      </div>

      {/* Content info in the middle */}
      <div className="absolute bottom-16 left-0 right-0 p-4">
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-white line-clamp-2">
          {content.title}
        </h2>
        {content.excerpt && (
          <p className="text-sm text-gray-200 line-clamp-2">
            {content.excerpt}
          </p>
        )}
      </div>

      {/* Action buttons at bottom right */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm",
            "text-white hover:text-primary hover:bg-white/20",
            isLiked && "text-red-500"
          )}
          onClick={handleLike}
        >
          <Heart className={cn(
            "h-6 w-6 transition-colors",
            isLiked && "fill-current"
          )} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:text-primary hover:bg-white/20"
          onClick={handleShare}
        >
          <Share2 className="h-6 w-6" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:text-primary hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertCircle className="h-6 w-6" />
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}