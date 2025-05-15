import { format } from "date-fns";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
}

export function UserTable({ users, isLoading = false }: UserTableProps) {
  // Format date for display
  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, "yyyy-MM-dd HH:mm");
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="text-left text-dark-500 dark:text-light-400 border-b border-light-500 dark:border-dark-600">
              <th className="pb-3 font-medium">ID</th>
              <th className="pb-3 font-medium">Foydalanuvchi</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Ro'yhatdan o'tgan sana</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {Array(3).fill(0).map((_, index) => (
              <tr key={index} className="border-b border-light-500 dark:border-dark-600">
                <td className="py-3">
                  <div className="h-4 w-16 bg-light-400 dark:bg-dark-500 animate-pulse rounded"></div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-light-400 dark:bg-dark-500 animate-pulse"></div>
                    <div>
                      <div className="h-4 w-24 bg-light-400 dark:bg-dark-500 animate-pulse rounded mb-1"></div>
                      <div className="h-3 w-16 bg-light-400 dark:bg-dark-500 animate-pulse rounded"></div>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <div className="h-4 w-32 bg-light-400 dark:bg-dark-500 animate-pulse rounded"></div>
                </td>
                <td className="py-3">
                  <div className="h-4 w-32 bg-light-400 dark:bg-dark-500 animate-pulse rounded"></div>
                </td>
                <td className="py-3">
                  <div className="h-6 w-16 bg-light-400 dark:bg-dark-500 animate-pulse rounded-full"></div>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-light-400 dark:bg-dark-500 animate-pulse rounded-lg"></div>
                    <div className="h-8 w-8 bg-light-400 dark:bg-dark-500 animate-pulse rounded-lg"></div>
                    <div className="h-8 w-8 bg-light-400 dark:bg-dark-500 animate-pulse rounded-lg"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="text-left text-dark-500 dark:text-light-400 border-b border-light-500 dark:border-dark-600">
            <th className="pb-3 font-medium">ID</th>
            <th className="pb-3 font-medium">Foydalanuvchi</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Ro'yhatdan o'tgan sana</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Amallar</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-dark-500 dark:text-light-400">
                Hech qanday foydalanuvchi topilmadi
              </td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr key={user.id} className="border-b border-light-500 dark:border-dark-600">
                <td className="py-3 text-dark-700 dark:text-light-300">#{index + 1}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <img 
                      src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.username)}&background=random`} 
                      alt={user.nickname || user.username} 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-dark-800 dark:text-light-100">
                        {user.nickname || "Noma'lum"}
                      </h4>
                      <p className="text-xs text-dark-500 dark:text-light-500">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-dark-700 dark:text-light-300">{user.email || "-"}</td>
                <td className="py-3 text-dark-500 dark:text-light-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="py-3">
                  {user.isOnline ? (
                    <Badge variant="outline" className="bg-accent/20 text-accent border-0 px-3 py-1 rounded-full">
                      Aktiv
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-light-500 dark:bg-dark-500 text-dark-500 dark:text-light-400 border-0 px-3 py-1 rounded-full">
                      Nofaol
                    </Badge>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-light-300 dark:hover:bg-dark-600">
                      <Eye className="h-4 w-4 text-dark-500 dark:text-light-400" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-light-300 dark:hover:bg-dark-600">
                      <Edit className="h-4 w-4 text-dark-500 dark:text-light-400" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-light-300 dark:hover:bg-dark-600">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
