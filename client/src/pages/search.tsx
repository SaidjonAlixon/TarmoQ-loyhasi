import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Search() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Query for all users (when no search query)
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users/all"],
    queryFn: async () => {
      const res = await fetch("/api/users/all", {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error(`Failed to fetch users: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: showAllUsers && !searchQuery,
  });

  // Query for user search
  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const url = `/api/users/search?q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) return [];
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorData.message || `Search failed: ${res.statusText}`);
      }
      const data = await res.json();
      console.log("Search results:", data);
      return data;
    },
    enabled: !!searchQuery && searchQuery.length >= 2,
    retry: false,
  });

  const createChatWithUser = async (foundUser: any) => {
    try {
      const newChat = await apiRequest({
        method: 'POST',
        url: '/api/chats',
        body: JSON.stringify({
          name: `Chat with ${foundUser.nickname || foundUser.username}`,
          isGroup: false,
          participants: [foundUser.id]
        })
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Chat yaratildi",
      });

      navigate('/chat');
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Chat yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 bg-[#0e1621] text-white p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Qidirish</h1>

        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6e7a8a]" />
            <Input
              type="text"
              placeholder="Foydalanuvchilarni qidirish..."
              className="w-full bg-[#17212b] border-[#242f3d] rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-[#6e7a8a] focus:ring-2 focus:ring-[#5288c1]"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAllUsers(false);
              }}
            />
          </div>
        </div>

        {searchQuery.length < 2 ? (
          <Card className="bg-[#17212b] border-[#242f3d]">
            <CardContent className="py-12 text-center">
              <SearchIcon className="h-16 w-16 text-[#6e7a8a] mx-auto mb-4" />
              <p className="text-[#6e7a8a] text-lg mb-4">Qidirish uchun kamida 2 ta harf kiriting</p>
              <Button
                variant="ghost"
                className="text-[#5288c1] hover:text-[#4a7ab8] hover:bg-[#242f3d]"
                onClick={() => setShowAllUsers(!showAllUsers)}
              >
                {showAllUsers ? "Barcha foydalanuvchilarni yashirish" : "Barcha foydalanuvchilarni ko'rsatish"}
              </Button>
              {showAllUsers && allUsers.length > 0 && (
                <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
                  {allUsers.map((foundUser: any) => (
                    <Card
                      key={foundUser.id}
                      className="bg-[#242f3d] border-[#242f3d] hover:bg-[#1e2832] transition-colors cursor-pointer"
                      onClick={() => createChatWithUser(foundUser)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 bg-[#5288c1]">
                            <AvatarImage 
                              src={foundUser.profileImageUrl || `https://ui-avatars.com/api/?name=${foundUser.nickname || foundUser.username}&background=5288c1&color=fff`} 
                              alt={foundUser.nickname || foundUser.username} 
                            />
                            <AvatarFallback className="bg-[#5288c1] text-white">
                              {(foundUser.nickname || foundUser.username || "").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">
                              {foundUser.nickname || foundUser.username}
                            </h3>
                            <p className="text-sm text-[#6e7a8a]">@{foundUser.username}</p>
                            {foundUser.isOnline && (
                              <p className="text-xs text-[#4ade80] mt-1">Online</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {foundUser.isOnline && (
                              <div className="h-3 w-3 bg-[#4ade80] rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {showAllUsers && allUsers.length === 0 && (
                <p className="text-[#6e7a8a] text-sm mt-4">Boshqa foydalanuvchilar yo'q</p>
              )}
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card className="bg-[#17212b] border-[#242f3d]">
            <CardContent className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#5288c1] border-t-transparent rounded-full mx-auto"></div>
              <p className="text-[#6e7a8a] mt-4">Qidirilmoqda...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="bg-[#17212b] border-[#242f3d]">
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 text-[#6e7a8a] mx-auto mb-4" />
              <p className="text-red-400 text-lg">Xatolik: {error instanceof Error ? error.message : "Noma'lum xatolik"}</p>
            </CardContent>
          </Card>
        ) : searchResults.length === 0 ? (
          <Card className="bg-[#17212b] border-[#242f3d]">
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 text-[#6e7a8a] mx-auto mb-4" />
              <p className="text-[#6e7a8a] text-lg">Foydalanuvchi topilmadi</p>
              <p className="text-[#6e7a8a] text-sm mt-2">Boshqa so'rov bilan qayta urinib ko'ring</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {searchResults.map((foundUser: any) => (
              <Card
                key={foundUser.id}
                className="bg-[#17212b] border-[#242f3d] hover:bg-[#242f3d] transition-colors cursor-pointer"
                onClick={() => createChatWithUser(foundUser)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 bg-[#5288c1]">
                      <AvatarImage 
                        src={foundUser.profileImageUrl || `https://ui-avatars.com/api/?name=${foundUser.nickname || foundUser.username}&background=5288c1&color=fff`} 
                        alt={foundUser.nickname || foundUser.username} 
                      />
                      <AvatarFallback className="bg-[#5288c1] text-white">
                        {(foundUser.nickname || foundUser.username || "").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {foundUser.nickname || foundUser.username}
                      </h3>
                      <p className="text-sm text-[#6e7a8a]">@{foundUser.username}</p>
                      {foundUser.isOnline && (
                        <p className="text-xs text-[#4ade80] mt-1">Online</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {foundUser.isOnline && (
                        <div className="h-3 w-3 bg-[#4ade80] rounded-full"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
