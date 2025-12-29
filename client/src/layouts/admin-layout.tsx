import React, { ReactNode } from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to home if not admin
  React.useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-blue-50">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5">
      <AdminSidebar />
      {children}
    </div>
  );
}
