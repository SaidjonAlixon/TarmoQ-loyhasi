import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Edit, Save, X, User, Mail, Calendar, Shield } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [username, setUsername] = useState(user?.username || "");

  const handleSave = async () => {
    try {
      await apiRequest({
        method: 'POST',
        url: '/api/users/profile',
        body: JSON.stringify({ nickname, username })
      });
      
      toast({
        title: "Muvaffaqiyatli",
        description: "Profil yangilandi",
      });
      
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Profilni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 bg-[#0e1621] text-white p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profil</h1>
        
        <Card className="bg-[#17212b] border-[#242f3d]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Shaxsiy ma'lumotlar</CardTitle>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#5288c1] hover:text-[#4a7ab8]"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Tahrirlash
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#6e7a8a] hover:text-white"
                    onClick={() => {
                      setIsEditing(false);
                      setNickname(user?.nickname || "");
                      setUsername(user?.username || "");
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Bekor qilish
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#5288c1] hover:bg-[#4a7ab8] text-white"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Saqlash
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-[#5288c1]">
                <AvatarImage 
                  src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.nickname || user?.username}&background=5288c1&color=fff`} 
                  alt={user?.nickname || user?.username} 
                />
                <AvatarFallback className="bg-[#5288c1] text-white text-2xl">
                  {(user?.nickname || user?.username || "").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {user?.nickname || user?.username || "Foydalanuvchi"}
                </h2>
                <p className="text-[#6e7a8a]">@{user?.username}</p>
                {user?.isAdmin && (
                  <div className="flex items-center gap-1 mt-2 text-[#5288c1]">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Administrator</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#6e7a8a] flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Taxallus
                </Label>
                {isEditing ? (
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-[#242f3d] border-[#242f3d] text-white"
                  />
                ) : (
                  <p className="text-white">{user?.nickname || "Ko'rsatilmagan"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[#6e7a8a] flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Foydalanuvchi nomi
                </Label>
                {isEditing ? (
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-[#242f3d] border-[#242f3d] text-white"
                  />
                ) : (
                  <p className="text-white">@{user?.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[#6e7a8a] flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="text-white">{user?.email || "Ko'rsatilmagan"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#6e7a8a] flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ro'yxatdan o'tgan sana
                </Label>
                <p className="text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : "Noma'lum"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

