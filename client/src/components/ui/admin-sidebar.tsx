import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Users, 
  UsersRound, 
  MessageSquare, 
  AlertTriangle, 
  Settings,
  LogOut 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AdminSidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user?.isAdmin) {
    navigate("/");
    return null;
  }

  return (
    <div className="lg:col-span-1 bg-blue-700 text-white p-4 flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-bold font-montserrat">TarmoQ Admin</h1>
        <p className="text-primary-light text-sm">Boshqaruv paneli</p>
      </div>
      
      <div className="space-y-1">
        <Button
          variant="ghost"
          className={`w-full flex items-center gap-3 px-3 py-3 justify-start ${
            location === '/admin' ? 'bg-white/10' : 'hover:bg-white/10'
          } rounded-lg`}
          onClick={() => navigate('/admin')}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Asosiy</span>
        </Button>
        <Button
          variant="ghost"
          className={`w-full flex items-center gap-3 px-3 py-3 justify-start ${
            location === '/admin/users' ? 'bg-white/10' : 'hover:bg-white/10'
          } rounded-lg`}
          onClick={() => navigate('/admin/users')}
        >
          <Users className="h-5 w-5" />
          <span>Foydalanuvchilar</span>
        </Button>
        <Button
          variant="ghost"
          className={`w-full flex items-center gap-3 px-3 py-3 justify-start ${
            location === '/admin/groups' ? 'bg-white/10' : 'hover:bg-white/10'
          } rounded-lg`}
          onClick={() => navigate('/admin/groups')}
        >
          <UsersRound className="h-5 w-5" />
          <span>Guruhlar</span>
        </Button>
        <Button
          variant="ghost"
          className={`w-full flex items-center gap-3 px-3 py-3 justify-start ${
            location === '/admin/messages' ? 'bg-white/10' : 'hover:bg-white/10'
          } rounded-lg`}
          onClick={() => navigate('/admin/messages')}
        >
          <MessageSquare className="h-5 w-5" />
          <span>Xabarlar</span>
        </Button>
        <Button
          variant="ghost"
          className={`w-full flex items-center gap-3 px-3 py-3 justify-start ${
            location === '/admin/reports' ? 'bg-white/10' : 'hover:bg-white/10'
          } rounded-lg`}
          onClick={() => navigate('/admin/reports')}
        >
          <AlertTriangle className="h-5 w-5" />
          <span>Shikoyatlar</span>
        </Button>
        <Button
          variant="ghost"
          className={`w-full flex items-center gap-3 px-3 py-3 justify-start ${
            location === '/admin/settings' ? 'bg-white/10' : 'hover:bg-white/10'
          } rounded-lg`}
          onClick={() => navigate('/admin/settings')}
        >
          <Settings className="h-5 w-5" />
          <span>Sozlamalar</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full flex items-center gap-3 px-3 py-3 justify-start hover:bg-white/10 rounded-lg"
          onClick={() => navigate('/chat')}
        >
          <MessageSquare className="h-5 w-5" />
          <span>Chatga qaytish</span>
        </Button>
      </div>
      
      <div className="mt-auto pt-6 border-t border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.nickname || user.username}&background=random`} 
              alt={user.nickname || user.username} 
            />
            <AvatarFallback>
              {(user.nickname || user.username || "").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{user.nickname || user.username}</h3>
            <p className="text-xs text-primary-light">Admin</p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Chiqish</span>
        </Button>
      </div>
    </div>
  );
}
