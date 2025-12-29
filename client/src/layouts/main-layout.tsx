import React, { ReactNode } from "react";
import { SidebarNavigation } from "@/components/ui/sidebar-navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0e1621]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-[#5288c1] border-t-transparent rounded-full"></div>
          <p className="text-[#6e7a8a] text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex bg-[#0e1621]">
      <SidebarNavigation />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
