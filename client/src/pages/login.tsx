import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(3, "Foydalanuvchi nomi kamida 3 ta belgi bo'lishi kerak"),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Foydalanuvchi nomi kamida 3 ta belgi bo'lishi kerak"),
  nickname: z.string().min(2, "Taxallus kamida 2 ta belgi bo'lishi kerak"),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
  confirmPassword: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
  isAdmin: z.boolean().optional().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parollar bir xil emas",
  path: ["confirmPassword"],
});

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Redirect to chat if already authenticated
  if (isAuthenticated && user) {
    navigate('/chat');
    return null;
  }
  
  // Google login handler
  const handleGoogleLogin = () => {
    window.location.href = "/api/login";
  };
  
  // Login form setup
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form setup
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      nickname: "",
      password: "",
      confirmPassword: "",
      isAdmin: false,
    },
  });
  
  // Login handler
  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      await apiRequest("POST", "/api/users/login", values);
      toast({
        title: "Muvaffaqiyatli",
        description: "Siz tizimga kirdingiz",
      });
      navigate("/chat");
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Tizimga kirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };
  
  // Registration handler
  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    try {
      const { confirmPassword, ...registerData } = values;
      
      await apiRequest("POST", "/api/users/register", registerData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Siz ro'yhatdan o'tdingiz, endi tizimga kirishingiz mumkin",
      });
      
      setActiveTab("login");
      loginForm.setValue("username", values.username);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Ro'yhatdan o'tishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-blue-500 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 md:p-8">
          {/* App Logo */}
          <div className="flex justify-center mb-12">
            <div className="text-5xl font-bold text-blue-500 font-montserrat">
              TarmoQ 
              <span className="text-violet-500 text-xl ml-1">zamonaviy muloqot</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-lg bg-gray-100 p-1 w-full max-w-xs">
              <button 
                className={`auth-tab flex-1 py-2 px-4 rounded-md ${
                  activeTab === "login" 
                    ? "bg-white shadow-sm text-dark-700" 
                    : "text-gray-500"
                } font-medium`}
                onClick={() => setActiveTab("login")}
              >
                Kirish
              </button>
              <button 
                className={`auth-tab flex-1 py-2 px-4 rounded-md ${
                  activeTab === "register" 
                    ? "bg-white shadow-sm text-dark-700" 
                    : "text-gray-500"
                } font-medium`}
                onClick={() => setActiveTab("register")}
              >
                Ro'yhatdan o'tish
              </button>
            </div>
          </div>

          {/* Login Tab Content */}
          <div className={activeTab === "login" ? "" : "hidden"}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Tizimga kirish</h2>
              <p className="text-gray-500 mt-1 text-sm">
                TarmoQ xizmatidan foydalanish uchun tizimga kiring
              </p>
            </div>
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foydalanuvchi nomi</FormLabel>
                      <FormControl>
                        <Input placeholder="Foydalanuvchi nomingiz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parol</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Parolingiz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 mt-2"
                >
                  Kirish
                </Button>
              </form>
            </Form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white text-gray-500">yoki</span>
              </div>
            </div>

            {/* Google Auth Button */}
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 mb-4 py-2"
              onClick={handleGoogleLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google orqali kirish</span>
            </Button>
          </div>

          {/* Register Tab Content */}
          <div className={activeTab === "register" ? "" : "hidden"}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Ro'yhatdan o'tish</h2>
              <p className="text-gray-500 mt-1 text-sm">
                TarmoQ xizmatidan foydalanish uchun ro'yhatdan o'ting
              </p>
            </div>
            
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foydalanuvchi nomi</FormLabel>
                      <FormControl>
                        <Input placeholder="Foydalanuvchi nomingiz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxallus</FormLabel>
                      <FormControl>
                        <Input placeholder="Taxallusingiz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parol</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Parolingiz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parolni tasdiqlang</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Parolni tasdiqlang" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Input 
                          type="checkbox" 
                          checked={field.value}
                          onChange={e => field.onChange(e.target.checked)}
                          className="h-4 w-4" 
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Admin huquqlarini berish</FormLabel>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 mt-2"
                >
                  Ro'yhatdan o'tish
                </Button>
              </form>
            </Form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white text-gray-500">yoki</span>
              </div>
            </div>

            {/* Google Auth Button */}
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 mb-4 py-2"
              onClick={handleGoogleLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google orqali ro'yhatdan o'tish</span>
            </Button>
          </div>
          
          <div className="text-gray-500 mt-8 text-center text-sm">
            Tizimga kirib, siz foydalanuvchi shartlariga va xavfsizlik siyosatiga rozilik bildirasiz.
          </div>
        </div>
      </div>
    </div>
  );
}