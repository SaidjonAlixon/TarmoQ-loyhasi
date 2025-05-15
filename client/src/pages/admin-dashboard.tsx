import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ui/stat-card";
import { ActivityChart } from "@/components/ui/activity-chart";
import { UserTable } from "@/components/ui/user-table";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isDark, setIsDark] = useState(false);

  // Check if the user is admin, if not redirect
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  // Query for admin stats
  const { data: adminStats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query for all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Toggle dark mode
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Check if user prefers dark mode or has dark mode enabled previously
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="lg:col-span-3 xl:col-span-4 bg-light-300 dark:bg-dark-800 overflow-auto">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-dark-700 p-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-dark-800 dark:text-light-100">Boshqaruv paneli</h2>
          <p className="text-dark-500 dark:text-light-400 text-sm">Tizim statistikasi</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" aria-label="Bildirishnomalar">
            <Bell className="h-5 w-5 text-dark-500 dark:text-light-400" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleTheme}
            aria-label="Tungi rejim"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-light-400" />
            ) : (
              <Moon className="h-5 w-5 text-dark-500" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Jami foydalanuvchilar"
          value={adminStats?.totalUsers || 0}
          icon="users"
          change={12.5}
          loading={isLoading}
        />
        
        <StatCard
          title="Faol foydalanuvchilar"
          value={adminStats?.activeUsers || 0}
          icon="usersActive"
          change={8.3}
          loading={isLoading}
        />
        
        <StatCard
          title="Guruhlar soni"
          value={adminStats?.groups || 0}
          icon="groups"
          change={5.7}
          loading={isLoading}
        />
        
        <StatCard
          title="Bugungi xabarlar"
          value={adminStats?.messagesToday || 0}
          icon="messages"
          change={-2.3}
          loading={isLoading}
        />
      </div>
      
      {/* User Activity and List */}
      <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-dark-700 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-dark-800 dark:text-light-100">Foydalanuvchilar faolligi</h3>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm">Hafta</Button>
              <Button variant="ghost" size="sm">Oy</Button>
              <Button variant="ghost" size="sm">Yil</Button>
            </div>
          </div>
          <ActivityChart />
        </div>
        
        {/* Top Users */}
        <div className="bg-white dark:bg-dark-700 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-dark-800 dark:text-light-100">Eng faol foydalanuvchilar</h3>
            <Button variant="link" size="sm">Hammasini ko'rish</Button>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-light-400 dark:bg-dark-500 animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-3/4 bg-light-400 dark:bg-dark-500 animate-pulse rounded"></div>
                    <div className="h-3 w-1/2 bg-light-400 dark:bg-dark-500 animate-pulse rounded mt-2"></div>
                  </div>
                  <div className="h-4 w-8 bg-light-400 dark:bg-dark-500 animate-pulse rounded"></div>
                </div>
              ))
            ) : (
              adminStats?.recentUsers?.slice(0, 4).map((user: any) => (
                <div key={user.id} className="flex items-center gap-3">
                  <img
                    src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.nickname || user.username}&background=random`}
                    alt={user.nickname || user.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-dark-800 dark:text-light-100 truncate">
                      {user.nickname || user.username}
                    </h4>
                    <p className="text-xs text-dark-500 dark:text-light-500">
                      @{user.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-dark-500 dark:text-light-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{Math.floor(Math.random() * 500)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Recent Registrations */}
      <div className="p-4">
        <div className="bg-white dark:bg-dark-700 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-dark-800 dark:text-light-100">Yangi ro'yhatdan o'tganlar</h3>
            <Button variant="link" size="sm">Hammasini ko'rish</Button>
          </div>
          <UserTable users={allUsers} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
