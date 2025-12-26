import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  MessageSquare, 
  Users, 
  UserCircle, 
  Search, 
  Settings, 
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { 
      id: 'chat',
      icon: MessageSquare, 
      label: 'Xabarlar', 
      path: '/chat',
      onClick: () => navigate('/chat')
    },
    { 
      id: 'profile',
      icon: UserCircle, 
      label: 'Profil', 
      path: '/profile',
      onClick: () => navigate('/profile')
    },
    { 
      id: 'groups',
      icon: Users, 
      label: 'Guruhlar', 
      path: '/groups',
      onClick: () => navigate('/groups')
    },
    { 
      id: 'search',
      icon: Search, 
      label: 'Qidirish', 
      path: '/search',
      onClick: () => navigate('/search')
    },
  ];

  return (
    <div className="hidden md:flex flex-col w-16 bg-[#17212b] border-r border-[#242f3d] p-3 flex-shrink-0 relative">
      <div className="flex flex-col items-center gap-4">
        {/* App Logo */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="h-12 w-12 bg-[#5288c1] rounded-full flex items-center justify-center text-white font-bold text-lg mt-2 cursor-pointer hover:bg-[#4a7ab8] transition-colors"
                onClick={() => navigate('/chat')}
              >
                T
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>TarmoQ</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Navigation Items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path === '/chat' && location === '/');
          
          return (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 rounded-full transition-all ${
                      isActive 
                        ? 'bg-[#5288c1] hover:bg-[#4a7ab8] text-white' 
                        : 'hover:bg-[#242f3d] text-[#6e7a8a]'
                    }`}
                    onClick={item.onClick}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      
      <div className="mt-auto flex flex-col items-center gap-4">
        {user?.isAdmin && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-full transition-colors ${
                    location === '/admin' 
                      ? 'bg-[#5288c1] hover:bg-[#4a7ab8] text-white' 
                      : 'hover:bg-[#242f3d] text-[#6e7a8a]'
                  }`}
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="h-5 w-5" />
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
                className="h-12 w-12 rounded-full hover:bg-[#242f3d] text-[#6e7a8a]"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Chiqish</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {user && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar 
                  className="h-12 w-12 border-2 border-[#242f3d] cursor-pointer hover:border-[#5288c1] transition-colors"
                  onClick={() => navigate('/profile')}
                >
                  <AvatarImage 
                    src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.nickname || user.username}&background=5288c1&color=fff`} 
                    alt={user.nickname || user.username} 
                  />
                  <AvatarFallback className="bg-[#5288c1] text-white">
                    {(user.nickname || user.username || "").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{user.nickname || user.username}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Expanded label on hover */}
      {hoveredItem && (
        <div className="absolute left-full ml-2 bg-[#242f3d] text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 fade-in shadow-lg border border-[#17212b]">
          {navItems.find(item => item.id === hoveredItem)?.label}
        </div>
      )}
    </div>
  );
}
