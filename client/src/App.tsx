import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Chat from "@/pages/chat";
import AdminDashboard from "@/pages/admin-dashboard";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/layouts/main-layout";
import { AdminLayout } from "@/layouts/admin-layout";

function App() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-light-300 dark:bg-dark-800">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={user ? Chat : Login} />
          <Route path="/login" component={Login} />
          
          <Route path="/chat">
            {() => {
              if (user) {
                return (
                  <MainLayout>
                    <Chat />
                  </MainLayout>
                );
              } else {
                navigate("/login");
                return null;
              }
            }}
          </Route>
          
          <Route path="/admin">
            {() => {
              // Safely check admin status
              const isAdmin = user && typeof user === 'object' && 'isAdmin' in (user as Record<string, any>) && (user as any).isAdmin;
              if (isAdmin) {
                return (
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                );
              } else {
                navigate("/");
                return null;
              }
            }}
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </>
  );
}

export default App;
