import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Users, Search } from "lucide-react";
import { format } from "date-fns";

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");

  // Query for all chats (groups)
  const { data: chats = [] } = useQuery({
    queryKey: ["/api/chats"],
  });

  // Filter only group chats
  const groups = chats.filter((chat: any) => chat.isGroup);

  // Filter by search query
  const filteredGroups = groups.filter((group: any) => {
    if (!searchQuery) return true;
    return group.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Xatolik",
        description: "Guruh nomini kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest({
        method: 'POST',
        url: '/api/chats',
        body: JSON.stringify({
          name: groupName,
          isGroup: true,
          participants: []
        })
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Guruh yaratildi",
      });

      setGroupName("");
      setShowCreateGroup(false);
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Guruh yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 bg-[#0e1621] text-white p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Guruhlar</h1>
          <Button
            className="bg-[#5288c1] hover:bg-[#4a7ab8] text-white"
            onClick={() => setShowCreateGroup(!showCreateGroup)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yangi guruh
          </Button>
        </div>

        {showCreateGroup && (
          <Card className="bg-[#17212b] border-[#242f3d] mb-6">
            <CardHeader>
              <CardTitle className="text-white">Yangi guruh yaratish</CardTitle>
              <CardDescription className="text-[#6e7a8a]">
                Yangi guruh yarating va foydalanuvchilarni qo'shing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Guruh nomi"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="bg-[#242f3d] border-[#242f3d] text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-[#5288c1] hover:bg-[#4a7ab8] text-white"
                  onClick={handleCreateGroup}
                >
                  Yaratish
                </Button>
                <Button
                  variant="ghost"
                  className="text-[#6e7a8a] hover:text-white"
                  onClick={() => {
                    setShowCreateGroup(false);
                    setGroupName("");
                  }}
                >
                  Bekor qilish
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6e7a8a]" />
            <Input
              type="text"
              placeholder="Guruhlarni qidirish..."
              className="w-full bg-[#17212b] border-[#242f3d] rounded-lg py-2 pl-10 pr-4 text-white placeholder:text-[#6e7a8a]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <Card className="bg-[#17212b] border-[#242f3d]">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-[#6e7a8a] mx-auto mb-4" />
              <p className="text-[#6e7a8a] text-lg">
                {searchQuery ? "Guruh topilmadi" : "Hali guruhlar yo'q"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map((group: any) => (
              <Card
                key={group.id}
                className="bg-[#17212b] border-[#242f3d] hover:bg-[#242f3d] transition-colors cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 bg-[#5288c1]">
                      <AvatarFallback className="bg-[#5288c1] text-white">
                        <Users className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{group.name || "Guruh"}</h3>
                      <p className="text-sm text-[#6e7a8a]">
                        {group.participants?.length || 0} a'zo
                      </p>
                      {group.lastMessage && (
                        <p className="text-xs text-[#6e7a8a] mt-1 truncate">
                          {format(new Date(group.lastMessage.createdAt), "HH:mm")}
                        </p>
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

