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
import { UserTable } from "@/components/ui/user-table";

function App() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-blue-50">
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
          
          {/* Admin routes for each section */}
          <Route path="/admin/users">
            {() => {
              const isAdmin = user && typeof user === 'object' && 'isAdmin' in (user as Record<string, any>) && (user as any).isAdmin;
              if (isAdmin) {
                return (
                  <AdminLayout>
                    <div className="lg:col-span-3 xl:col-span-4 bg-white p-6">
                      <h1 className="text-2xl font-bold text-gray-800 mb-6">Foydalanuvchilar boshqaruvi</h1>
                      <p className="text-gray-600 mb-4">Bu yerda barcha foydalanuvchilar ro'yxati va ularni boshqarish imkoniyatlari mavjud.</p>
                      <UserTable users={user.allUsers || []} isLoading={false} />
                    </div>
                  </AdminLayout>
                );
              } else {
                navigate("/");
                return null;
              }
            }}
          </Route>
          
          <Route path="/admin/groups">
            {() => {
              const isAdmin = user && typeof user === 'object' && 'isAdmin' in (user as Record<string, any>) && (user as any).isAdmin;
              if (isAdmin) {
                return (
                  <AdminLayout>
                    <div className="lg:col-span-3 xl:col-span-4 bg-white p-6">
                      <h1 className="text-2xl font-bold text-gray-800 mb-6">Guruhlar boshqaruvi</h1>
                      <p className="text-gray-600">Bu yerda barcha guruhlar ro'yxati va ularni boshqarish imkoniyatlari mavjud.</p>
                    </div>
                  </AdminLayout>
                );
              } else {
                navigate("/");
                return null;
              }
            }}
          </Route>
          
          <Route path="/admin/messages">
            {() => {
              const isAdmin = user && typeof user === 'object' && 'isAdmin' in (user as Record<string, any>) && (user as any).isAdmin;
              if (isAdmin) {
                return (
                  <AdminLayout>
                    <div className="lg:col-span-3 xl:col-span-4 bg-white p-6">
                      <h1 className="text-2xl font-bold text-gray-800 mb-6">Xabarlar monitoringi</h1>
                      <p className="text-gray-600">Bu yerda barcha xabarlar va ularni nazorat qilish imkoniyatlari mavjud.</p>
                    </div>
                  </AdminLayout>
                );
              } else {
                navigate("/");
                return null;
              }
            }}
          </Route>
          
          <Route path="/admin/reports">
            {() => {
              const isAdmin = user && typeof user === 'object' && 'isAdmin' in (user as Record<string, any>) && (user as any).isAdmin;
              if (isAdmin) {
                return (
                  <AdminLayout>
                    <div className="lg:col-span-3 xl:col-span-4 bg-white p-6">
                      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shikoyatlar</h1>
                      <p className="text-gray-600">Bu yerda foydalanuvchilardan kelgan shikoyatlar ro'yxati va ularni boshqarish imkoniyatlari mavjud.</p>
                    </div>
                  </AdminLayout>
                );
              } else {
                navigate("/");
                return null;
              }
            }}
          </Route>
          
          <Route path="/admin/settings">
            {() => {
              const isAdmin = user && typeof user === 'object' && 'isAdmin' in (user as Record<string, any>) && (user as any).isAdmin;
              if (isAdmin) {
                return (
                  <AdminLayout>
                    <div className="lg:col-span-3 xl:col-span-4 bg-white p-6">
                      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tizim sozlamalari</h1>
                      <p className="text-gray-600 mb-6">Bu yerda tizim sozlamalarini o'zgartirish imkoniyatlari mavjud.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                          <h2 className="text-lg font-semibold mb-4">Tizim ma'lumotlari</h2>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Versiya:</span>
                              <span className="font-medium">1.0.0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Oxirgi yangilanish:</span>
                              <span className="font-medium">17.05.2025</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Server holati:</span>
                              <span className="text-green-600 font-medium">Aktiv</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h2 className="text-lg font-semibold mb-4">Xavfsizlik</h2>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Ikki bosqichli tekshirish</span>
                              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Xabarlarni shifrlash</span>
                              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked />
                                <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
