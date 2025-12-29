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

export function SidebarNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

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
    { 
      id: 'settings',
      icon: Settings, 
      label: 'Sozlamalar', 
      path: '/settings',
      onClick: () => navigate('/settings')
    },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-[#17212b] border-r border-[#242f3d] flex-shrink-0">
      {/* App Logo */}
      <div className="p-4 border-b border-[#242f3d]">
        <div 
          className="h-12 w-12 bg-[#5288c1] rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:bg-[#4a7ab8] transition-colors"
          onClick={() => navigate('/chat')}
        >
          T
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path === '/chat' && location === '/');
          
          return (
            <div key={item.id} className="relative">
              <Button
                variant="ghost"
                className={`w-full flex items-center gap-3 px-4 py-3 justify-start rounded-lg transition-all ${
                  isActive 
                    ? 'bg-[#5288c1] hover:bg-[#4a7ab8] text-white' 
                    : 'hover:bg-[#242f3d] text-[#6e7a8a] hover:text-white'
                }`}
                onClick={item.onClick}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
              {/* Active indicator - blue line on the left */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5288c1] rounded-r"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Bottom Section */}
      <div className="mt-auto border-t border-[#242f3d] p-4 space-y-2">
        {user?.isAdmin && (
          <Button
            variant="ghost"
            className={`w-full flex items-center gap-3 px-4 py-3 justify-start rounded-lg transition-all ${
              location === '/admin' 
                ? 'bg-[#5288c1] hover:bg-[#4a7ab8] text-white' 
                : 'hover:bg-[#242f3d] text-[#6e7a8a] hover:text-white'
            }`}
            onClick={() => navigate('/admin')}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Admin panel</span>
          </Button>
        )}
        
        <Button
          variant="ghost"
          className="w-full flex items-center gap-3 px-4 py-3 justify-start rounded-lg hover:bg-[#242f3d] text-[#6e7a8a] hover:text-white transition-all"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Chiqish</span>
        </Button>
        
        {user && (
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#242f3d] cursor-pointer transition-colors"
            onClick={() => navigate('/profile')}
          >
            <Avatar 
              className="h-10 w-10 border-2 border-[#242f3d] hover:border-[#5288c1] transition-colors flex-shrink-0"
            >
              <AvatarImage 
                src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.nickname || user.username}&background=5288c1&color=fff`} 
                alt={user.nickname || user.username} 
              />
              <AvatarFallback className="bg-[#5288c1] text-white">
                {(user.nickname || user.username || "").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.nickname || user.username}
              </p>
              <p className="text-xs text-[#6e7a8a] truncate">
                @{user.username}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
