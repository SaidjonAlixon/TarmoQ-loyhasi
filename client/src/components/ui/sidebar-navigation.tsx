import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  MessageSquare, 
  Users, 
  UserCircle, 
  Search, 
  Settings, 
  Sun, 
  Moon,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="hidden md:flex flex-col w-20 bg-blue-600 text-white p-4">
      <div className="flex flex-col items-center gap-6">
        {/* App Logo */}
        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
          T
        </div>
        
        {/* Navigation Items */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={location === '/chat' ? 'secondary' : 'ghost'}
                size="icon"
                className={`h-12 w-12 rounded-full ${
                  location === '/chat' 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Xabarlar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-white/10"
              >
                <UserCircle className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Profil</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-white/10"
              >
                <Users className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Guruhlar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-white/10"
              >
                <Search className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Qidirish</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="mt-auto flex flex-col items-center gap-6">
        {user?.isAdmin && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={location === '/admin' ? 'secondary' : 'ghost'}
                  size="icon"
                  className={`h-12 w-12 rounded-full ${
                    location === '/admin' 
                      ? 'bg-white/20 hover:bg-white/30' 
                      : 'hover:bg-white/10'
                  }`}
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Admin panel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-white/10 hidden"
                onClick={toggleTheme}
              >
                <Sun className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Yorug' rejim</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Chiqish</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {user && (
          <Avatar className="h-12 w-12 border-2 border-white/20">
            <AvatarImage 
              src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.nickname || user.username}&background=random`} 
              alt={user.nickname || user.username} 
            />
            <AvatarFallback>
              {(user.nickname || user.username || "").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
