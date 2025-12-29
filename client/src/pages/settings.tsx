import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  User, 
  Lock, 
  Shield, 
  Cloud, 
  Globe, 
  LogOut,
  Bell,
  Download,
  Palette,
  Check
} from "lucide-react";
import { useLocation } from "wouter";
import { SidebarNavigation } from "@/components/ui/sidebar-navigation";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState('settings');
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(true);
  const [appearanceNotifications, setAppearanceNotifications] = useState(true);
  const [selectedColor, setSelectedColor] = useState('blue');
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('uzbek');

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const sidebarItems = [
    { id: 'settings', icon: Settings, label: 'Sozlamalar' },
    { id: 'account', icon: User, label: 'Hisob' },
    { id: 'privacy', icon: Lock, label: 'Maxfiylik' },
    { id: 'security', icon: Shield, label: 'Xavfsizlik' },
    { id: 'data', icon: Cloud, label: 'Ma\'lumotlar saqlash' },
    { id: 'language', icon: Globe, label: 'Til: O\'zbekcha' },
    { id: 'logout', icon: LogOut, label: 'Chiquish' },
  ];

  const colors = [
    { id: 'blue', color: 'bg-[#5288c1]' },
    { id: 'gray', color: 'bg-gray-500' },
    { id: 'teal', color: 'bg-teal-500' },
  ];

  return (
    <div className="h-screen flex bg-[#0e1621]">
      <SidebarNavigation />
      <div className="flex-1 bg-[#0e1621] text-white flex overflow-hidden">
        {/* Settings Left Sidebar */}
        <div className="w-64 bg-[#17212b] border-r border-[#242f3d] flex flex-col flex-shrink-0">
        <div className="flex-1 py-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <div key={item.id} className="relative">
                <Button
                  variant="ghost"
                  className={`w-full flex items-center gap-3 px-4 py-3 justify-start rounded-lg transition-all ${
                    isActive 
                      ? 'bg-[#5288c1] hover:bg-[#4a7ab8] text-white' 
                      : 'hover:bg-[#242f3d] text-white hover:text-white'
                  }`}
                  onClick={() => {
                    if (item.id === 'logout') {
                      handleLogout();
                    } else {
                      setActiveSection(item.id);
                    }
                  }}
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
      </div>

      {/* Main Content Area - Shaffof oyna */}
      <div className="flex-1 bg-[#0e1621] p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Shaffof oyna container */}
          <div className="bg-[#17212b]/80 backdrop-blur-sm border border-[#242f3d]/50 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Sozlamalar</h1>

            {/* Umumij (General) Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6">Umumij</h2>
              
              <div className="space-y-6">
                {/* Bildirishnomalar */}
                <div className="flex items-center justify-between py-3 border-b border-[#242f3d]">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-[#6e7a8a]" />
                    <span className="text-white">Bildirishnomalar</span>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                    className="data-[state=checked]:bg-[#5288c1]"
                  />
                </div>

                {/* Avtomatik yuklash */}
                <div className="flex items-center justify-between py-3 border-b border-[#242f3d]">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-[#6e7a8a]" />
                    <span className="text-white">Avtomatik yuklash</span>
                  </div>
                  <Switch
                    checked={autoDownload}
                    onCheckedChange={setAutoDownload}
                    className="data-[state=checked]:bg-[#5288c1]"
                  />
                </div>
              </div>
            </div>

            {/* Koriniuih (Appearance) Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6">Koriniuih</h2>
              
              <div className="space-y-6">
                {/* Bildirishnomalar */}
                <div className="flex items-center justify-between py-3 border-b border-[#242f3d]">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-[#6e7a8a]" />
                    <span className="text-white">Bildirishnomalar</span>
                  </div>
                  <Switch
                    checked={appearanceNotifications}
                    onCheckedChange={setAppearanceNotifications}
                    className="data-[state=checked]:bg-[#5288c1]"
                  />
                </div>

                {/* Rang tanlash */}
                <div className="py-3 border-b border-[#242f3d]">
                  <div className="flex items-center gap-3 mb-4">
                    <Palette className="h-5 w-5 text-[#6e7a8a]" />
                    <span className="text-white">Rang</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={`relative h-10 w-10 rounded-full ${color.color} transition-all ${
                          selectedColor === color.id 
                            ? 'ring-2 ring-[#5288c1] ring-offset-2 ring-offset-[#17212b] scale-110' 
                            : 'hover:scale-105'
                        }`}
                      >
                        {selectedColor === color.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mavzu */}
                <div className="flex items-center justify-between py-3 border-b border-[#242f3d]">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-[#6e7a8a]" />
                    <span className="text-white">Avtomatik yuklash</span>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-48 bg-[#242f3d] border-[#242f3d] text-white">
                      <SelectValue placeholder="Mavzu tanlang" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#17212b] border-[#242f3d]">
                      <SelectItem value="dark" className="text-white hover:bg-[#242f3d]">
                        Mavzu: Qora
                      </SelectItem>
                      <SelectItem value="light" className="text-white hover:bg-[#242f3d]">
                        Mavzu: Oq
                      </SelectItem>
                      <SelectItem value="auto" className="text-white hover:bg-[#242f3d]">
                        Mavzu: Avtomatik
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Til (Language) Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Til</h2>
              
              <div className="space-y-6">
                {/* O'zlamalar */}
                <div className="flex items-center justify-between py-3 border-b border-[#242f3d]">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-[#6e7a8a]" />
                    <span className="text-white">Özzlamalar</span>
                  </div>
                  <Check className="h-5 w-5 text-[#5288c1]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

