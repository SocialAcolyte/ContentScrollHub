import { useState } from "react";
import { SourceSelector } from "@/components/content/SourceSelector";
import { ContentViewer } from "@/components/content/ContentViewer";
import { Button } from "@/components/ui/button";
import { FaTwitter } from "react-icons/fa";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { Crown, User } from "lucide-react";

export default function Home() {
  const [selectedSource, setSelectedSource] = useState<string>();
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed top bar with source selector and user controls */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/SocialAcolyte"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Button variant="outline" size="sm" className="text-white">
                <FaTwitter className="h-4 w-4 mr-2" />
                Follow me
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {!user.isPremium && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700"
                    onClick={() => setLocation("/subscribe")}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Go Premium
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/auth")}
                className="text-white"
              >
                Login
              </Button>
            )}
          </div>
        </div>
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