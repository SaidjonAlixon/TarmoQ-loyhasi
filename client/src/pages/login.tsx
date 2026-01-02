import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(3, "Foydalanuvchi nomi kamida 3 ta belgi bo'lishi kerak"),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Foydalanuvchi nomi kamida 3 ta belgi bo'lishi kerak"),
  nickname: z.string().min(2, "Ism kamida 2 ta belgi bo'lishi kerak"),
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
  const queryClient = useQueryClient();
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);
  
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
      const data = await apiRequest({
        method: "POST",
        url: "/api/users/login",
        body: JSON.stringify(values)
      });
      
      toast({
        title: "Muvaffaqiyatli",
        description: "Siz tizimga kirdingiz",
      });
      
      // Force a refresh of auth state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // If admin, navigate to admin dashboard, otherwise to chat
      if (data.user && data.user.isAdmin) {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
      
      // Force location reload to ensure everything is refreshed
      setTimeout(() => {
        window.location.reload();
      }, 500);
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
      
      await apiRequest({
        method: "POST",
        url: "/api/users/register",
        body: JSON.stringify(registerData)
      });
      
      toast({
        title: "Muvaffaqiyatli",
        description: "Siz ro'yhatdan o'tdingiz, endi tizimga kirishingiz mumkin",
      });
      
      setIsRightPanelActive(false);
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
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`,
      } as React.CSSProperties}
    >
      {/* Ultra Modern Animated Background */}
      <div className="animated-background">
        <div className="mesh-gradient"></div>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="gradient-orb orb-4"></div>
        <div className="gradient-orb orb-5"></div>
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
        <div className="floating-shape shape-5"></div>
        <div className="light-ray ray-1"></div>
        <div className="light-ray ray-2"></div>
        <div className="light-ray ray-3"></div>
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
        <div className="geometric-pattern pattern-1"></div>
        <div className="geometric-pattern pattern-2"></div>
        <div className="glass-panel panel-1"></div>
        <div className="glass-panel panel-2"></div>
      </div>

      {/* Login Section */}
      <section className="flex items-center justify-center h-full p-4" style={{ position: 'relative', zIndex: 10 }}>
        <div 
          className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`}
          style={{
            background: '#fff',
            borderRadius: '90px',
            boxShadow: '30px 14px 28px rgba(0, 5, 5, .2), 0 10px 10px rgba(0, 0, 0, .2)',
            position: 'relative',
            overflow: 'hidden',
            opacity: '95%',
            width: '1000px',
            maxWidth: '95%',
            minHeight: '600px',
            transition: '333ms'
          }}
        >
          {/* Sign Up Form Container */}
          <div 
            className="form-container sign-up-container"
            style={{
              position: 'absolute',
              top: 0,
              height: '100%',
              transition: 'all .6s ease-in-out',
              left: 0,
              width: '50%',
              zIndex: isRightPanelActive ? 5 : 1,
              opacity: isRightPanelActive ? 1 : 0,
              transform: isRightPanelActive ? 'translateX(100%)' : 'translateX(0)'
            }}
          >
            <Form {...registerForm}>
              <form 
                onSubmit={registerForm.handleSubmit(onRegister)}
                style={{
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0 70px',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <h1 style={{ fontWeight: 'bold', margin: 0, marginBottom: '25px', fontSize: '32px', color: '#0e263d' }}>Ro'yhatdan o'tish</h1>
                
                <div className="social-container" style={{ margin: '20px 0', display: 'block' }}>
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social"
                    style={{
                      border: '1px solid #008ecf',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 5px',
                      height: '40px',
                      width: '40px',
                      transition: '333ms',
                      textDecoration: 'none',
                      color: '#008ecf'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(13deg)';
                      e.currentTarget.style.borderColor = '#0e263d';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(0deg)';
                      e.currentTarget.style.borderColor = '#008ecf';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://codepen.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social"
                    style={{
                      border: '1px solid #008ecf',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 5px',
                      height: '40px',
                      width: '40px',
                      transition: '333ms',
                      textDecoration: 'none',
                      color: '#008ecf'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(13deg)';
                      e.currentTarget.style.borderColor = '#0e263d';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(0deg)';
                      e.currentTarget.style.borderColor = '#008ecf';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5c-5.79 0-10.5-4.71-10.5-10.5S6.21 1.5 12 1.5 22.5 6.21 22.5 12 17.79 22.5 12 22.5z"/>
                      <path d="M8.25 12l3.75 2.25v-4.5L8.25 12zm1.5-2.25L13.5 12l-3.75 2.25V9.75z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleGoogleLogin();
                    }}
                    className="social"
                    style={{
                      border: '1px solid #008ecf',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 5px',
                      height: '40px',
                      width: '40px',
                      transition: '333ms',
                      textDecoration: 'none',
                      color: '#008ecf',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(13deg)';
                      e.currentTarget.style.borderColor = '#0e263d';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(0deg)';
                      e.currentTarget.style.borderColor = '#008ecf';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </a>
                </div>
                
                <span style={{ fontSize: '13px', marginBottom: '15px', color: '#666', fontWeight: 500 }}>Yoki elektron pochtangiz orqali ro'yhatdan o'ting</span>
                
                <FormField
                  control={registerForm.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem style={{ width: '100%', marginBottom: '8px' }}>
                      <FormControl>
                        <Input
                          placeholder="Ism"
                          {...field}
                          style={{
                            background: '#eee',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '12px 15px',
                            margin: '10px 0',
                            width: '100%'
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem style={{ width: '100%', marginBottom: '8px' }}>
                      <FormControl>
                        <Input
                          placeholder="Foydalanuvchi nomi"
                          {...field}
                          style={{
                            background: '#eee',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '12px 15px',
                            margin: '8px 0',
                            width: '100%'
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem style={{ width: '100%', marginBottom: '8px' }}>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Parol"
                          {...field}
                          style={{
                            background: '#eee',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '12px 15px',
                            margin: '8px 0',
                            width: '100%'
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem style={{ width: '100%', marginBottom: '8px' }}>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Parolni tasdiqlang"
                          {...field}
                          style={{
                            background: '#eee',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '12px 15px',
                            margin: '8px 0',
                            width: '100%'
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <button
                  type="submit"
                  style={{
                    borderRadius: '50px',
                    boxShadow: '0 4px 15px rgba(0, 142, 207, 0.3)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #008ecf 0%, #006ba3 100%)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '15px 60px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease',
                    marginTop: '15px',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '400px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 142, 207, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 142, 207, 0.3)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                >
                  Ro'yhatdan o'tish
                </button>
              </form>
            </Form>
          </div>

          {/* Sign In Form Container */}
          <div 
            className="form-container sign-in-container"
            style={{
              position: 'absolute',
              top: 0,
              height: '100%',
              transition: 'all .6s ease-in-out',
              left: 0,
              width: '50%',
              zIndex: isRightPanelActive ? 2 : 2,
              transform: isRightPanelActive ? 'translateY(100%)' : 'translateY(0)'
            }}
          >
            <Form {...loginForm}>
              <form 
                onSubmit={loginForm.handleSubmit(onLogin)}
                style={{
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0 70px',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <h1 style={{ fontWeight: 'bold', margin: 0, marginBottom: '25px', fontSize: '32px', color: '#0e263d' }}>Kirish</h1>
                
                <div className="social-container" style={{ margin: '20px 0', display: 'block' }}>
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social"
                    style={{
                      border: '1px solid #008ecf',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 5px',
                      height: '40px',
                      width: '40px',
                      transition: '333ms',
                      textDecoration: 'none',
                      color: '#008ecf'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(13deg)';
                      e.currentTarget.style.borderColor = '#0e263d';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(0deg)';
                      e.currentTarget.style.borderColor = '#008ecf';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://codepen.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social"
                    style={{
                      border: '1px solid #008ecf',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 5px',
                      height: '40px',
                      width: '40px',
                      transition: '333ms',
                      textDecoration: 'none',
                      color: '#008ecf'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(13deg)';
                      e.currentTarget.style.borderColor = '#0e263d';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(0deg)';
                      e.currentTarget.style.borderColor = '#008ecf';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5c-5.79 0-10.5-4.71-10.5-10.5S6.21 1.5 12 1.5 22.5 6.21 22.5 12 17.79 22.5 12 22.5z"/>
                      <path d="M8.25 12l3.75 2.25v-4.5L8.25 12zm1.5-2.25L13.5 12l-3.75 2.25V9.75z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleGoogleLogin();
                    }}
                    className="social"
                    style={{
                      border: '1px solid #008ecf',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 5px',
                      height: '40px',
                      width: '40px',
                      transition: '333ms',
                      textDecoration: 'none',
                      color: '#008ecf',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(13deg)';
                      e.currentTarget.style.borderColor = '#0e263d';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotateZ(0deg)';
                      e.currentTarget.style.borderColor = '#008ecf';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </a>
                </div>
                
                <span style={{ fontSize: '13px', marginBottom: '15px', color: '#666', fontWeight: 500 }}>Yoki elektron pochta manzili orqali kirish</span>
                
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem style={{ width: '100%', marginBottom: '8px' }}>
                      <FormControl>
                        <Input
                          placeholder="Foydalanuvchi nomi"
                          {...field}
                          style={{
                            background: '#f5f5f5',
                            border: '1px solid #e0e0e0',
                            borderRadius: '50px',
                            padding: '14px 20px',
                            margin: '10px 0',
                            width: '100%',
                            fontSize: '15px',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.borderColor = '#008ecf';
                            e.target.style.transform = 'scale(1.02)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f5f5f5';
                            e.target.style.borderColor = '#e0e0e0';
                            e.target.style.transform = 'scale(1)';
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem style={{ width: '100%', marginBottom: '8px' }}>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Parol"
                          {...field}
                          style={{
                            background: '#f5f5f5',
                            border: '1px solid #e0e0e0',
                            borderRadius: '50px',
                            padding: '14px 20px',
                            margin: '10px 0',
                            width: '100%',
                            fontSize: '15px',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.borderColor = '#008ecf';
                            e.target.style.transform = 'scale(1.02)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f5f5f5';
                            e.target.style.borderColor = '#e0e0e0';
                            e.target.style.transform = 'scale(1)';
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  style={{
                    color: '#0e263d',
                    fontSize: '14px',
                    textDecoration: 'none',
                    margin: '15px 0'
                  }}
                >
                  Parolingizni unutdingizmi?
                </a>
                
                <button
                  type="submit"
                  style={{
                    borderRadius: '50px',
                    boxShadow: '0 4px 15px rgba(0, 142, 207, 0.3)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #008ecf 0%, #006ba3 100%)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '15px 60px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease',
                    marginTop: '10px',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '400px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 142, 207, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 142, 207, 0.3)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                >
                  Kirish
                </button>
              </form>
            </Form>
          </div>

          {/* Overlay Container */}
          <div 
            className="overlay-container"
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '50%',
              height: '100%',
              overflow: 'hidden',
              transition: 'transform .6s ease-in-out',
              zIndex: 100,
              transform: isRightPanelActive ? 'translateX(-100%)' : 'translateX(0)'
            }}
          >
            <div 
              className="overlay"
              style={{
                background: 'linear-gradient(to right, #008ecf, #008ecf) no-repeat 0 0 / cover',
                color: '#fff',
                position: 'relative',
                left: '-100%',
                height: '100%',
                width: '200%',
                transform: isRightPanelActive ? 'translateX(50%)' : 'translateX(0)',
                transition: 'transform .6s ease-in-out'
              }}
            >
              <div 
                className="overlay-panel overlay-left"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  padding: '30px 40px 20px',
                  height: '100%',
                  width: '50%',
                  textAlign: 'center',
                  transform: isRightPanelActive ? 'translateY(20%)' : 'translateY(0)',
                  transition: 'transform .6s ease-in-out',
                  boxSizing: 'border-box'
                }}
              >
                {/* TarmoQ Logo va Izoh - Yuqori qism */}
                <div style={{ 
                  width: '100%',
                  paddingTop: '20px',
                  textAlign: 'center',
                  marginBottom: '40px'
                }}>
                  <h1 style={{ 
                    fontWeight: '800', 
                    margin: '0 auto 12px', 
                    fontSize: '72px',
                    color: '#ffffff',
                    textShadow: '0 4px 20px rgba(255, 255, 255, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2)',
                    letterSpacing: '3px',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                    lineHeight: '1.1',
                    textAlign: 'center'
                  }}>
                    TarmoQ
                  </h1>
                  <p style={{ 
                    fontSize: '15px', 
                    fontWeight: 400, 
                    lineHeight: '22px', 
                    letterSpacing: '0.8px', 
                    margin: '0 auto', 
                    opacity: 0.85,
                    color: '#e0f2fe',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                  }}>
                    Zamonaviy muloqot platformasi
                  </p>
                </div>
                
                {/* Kirish bo'limi - Pastki qism */}
                <div style={{
                  width: '100%',
                  paddingBottom: '20px',
                  marginTop: '0',
                  textAlign: 'center'
                }}>
                  <h2 style={{ 
                    fontWeight: '700', 
                    margin: '0 auto 12px', 
                    fontSize: '28px',
                    color: '#ffffff',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    letterSpacing: '0.5px',
                    textAlign: 'center'
                  }}>
                    Kirish
                  </h2>
                  <p style={{ 
                    fontSize: '15px', 
                    fontWeight: 300, 
                    lineHeight: '22px', 
                    letterSpacing: '0.5px', 
                    margin: '0 auto 25px', 
                    opacity: 0.9,
                    color: '#ffffff',
                    maxWidth: '320px',
                    textAlign: 'center'
                  }}>
                    Agar sizda allaqachon hisob bo'lsa, bu yerdan kiring
                  </p>
                  <button
                    className="ghost"
                    onClick={() => setIsRightPanelActive(false)}
                    style={{
                      borderRadius: '50px',
                      border: '2px solid #ffffff',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '700',
                      padding: '14px 45px',
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      minWidth: '200px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(.96)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                  >
                    Kirish
                  </button>
                </div>
              </div>
              
              <div 
                className="overlay-panel overlay-right"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '60px 40px 60px',
                  height: '100%',
                  width: '50%',
                  textAlign: 'center',
                  transform: isRightPanelActive ? 'translateY(0)' : 'translateY(-20%)',
                  transition: 'transform .6s ease-in-out',
                  boxSizing: 'border-box'
                }}
              >
                {/* TarmoQ Logo va Izoh - Yuqori qism */}
                <div style={{ 
                  width: '100%',
                  paddingTop: '100px',
                  textAlign: 'center'
                }}>
                  <h1 style={{ 
                    fontWeight: '800', 
                    margin: '0 auto 12px', 
                    fontSize: '72px',
                    color: '#ffffff',
                    textShadow: '0 4px 20px rgba(255, 255, 255, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2)',
                    letterSpacing: '3px',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                    lineHeight: '1.1',
                    textAlign: 'center'
                  }}>
                    TarmoQ
                  </h1>
                  <p style={{ 
                    fontSize: '15px', 
                    fontWeight: 400, 
                    lineHeight: '22px', 
                    letterSpacing: '0.8px', 
                    margin: '0 auto', 
                    opacity: 0.85,
                    color: '#e0f2fe',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                  }}>
                    Zamonaviy muloqot platformasi
                  </p>
                </div>
                
                {/* Hisob yarating bo'limi - Pastki qism */}
                <div style={{
                  width: '100%',
                  paddingBottom: '20px',
                  textAlign: 'center'
                }}>
                  <h2 style={{ 
                    fontWeight: '700', 
                    margin: '0 auto 16px', 
                    fontSize: '28px',
                    color: '#ffffff',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    letterSpacing: '0.5px',
                    textAlign: 'center'
                  }}>
                    Hisob yarating!
                  </h2>
                  <p style={{ 
                    fontSize: '15px', 
                    fontWeight: 300, 
                    lineHeight: '22px', 
                    letterSpacing: '0.5px', 
                    margin: '0 0 35px 0', 
                    opacity: 0.9,
                    color: '#ffffff',
                    maxWidth: '320px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'center'
                  }}>
                    Agar sizda hali hisob bo'lmasa, ro'yhatdan o'ting...
                  </p>
                  <button
                    className="ghost"
                    onClick={() => setIsRightPanelActive(true)}
                    style={{
                      borderRadius: '50px',
                      border: '2px solid #ffffff',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '700',
                      padding: '14px 45px',
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      minWidth: '200px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(.96)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                  >
                    Ro'yhatdan o'tish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .animated-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(ellipse at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 0, 150, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at calc(100% - var(--mouse-x, 50%)) calc(100% - var(--mouse-y, 50%)), rgba(0, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at var(--mouse-x, 50%) calc(100% - var(--mouse-y, 50%)), rgba(255, 255, 0, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0a0e27 0%, #1a0e37 25%, #2a0e47 50%, #1a0e37 75%, #0a0e27 100%);
          background-size: 100% 100%, 100% 100%, 100% 100%, 400% 400%;
          animation: backgroundShift 20s ease infinite;
          overflow: hidden;
          z-index: 0;
          transition: background 0.2s ease-out;
        }

        .mesh-gradient {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 0, 150, 0.4) 0%, transparent 50%),
            radial-gradient(circle at calc(100% - var(--mouse-x, 50%)) calc(100% - var(--mouse-y, 50%)), rgba(0, 255, 255, 0.4) 0%, transparent 50%),
            radial-gradient(circle at var(--mouse-x, 50%) calc(100% - var(--mouse-y, 50%)), rgba(255, 200, 0, 0.4) 0%, transparent 50%),
            radial-gradient(circle at calc(100% - var(--mouse-x, 50%)) var(--mouse-y, 50%), rgba(150, 0, 255, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(0, 255, 150, 0.3) 0%, transparent 50%);
          background-size: 200% 200%;
          animation: meshMove 20s ease infinite;
          z-index: 1;
          transition: background 0.1s ease-out;
        }

        .animated-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            ellipse at var(--mouse-x, 50%) var(--mouse-y, 50%), 
            rgba(255, 0, 255, 0.1) 0%, 
            rgba(0, 255, 255, 0.05) 35%, 
            rgba(255, 255, 0, 0.02) 70%,
            transparent 100%
          );
          z-index: 2;
          transition: background 0.2s ease-out;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.7;
          z-index: 1;
          mix-blend-mode: screen;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #ff00ff 0%, #ff1493 50%, #8b00ff 100%);
          top: -300px;
          left: -300px;
          animation: float1 25s ease-in-out infinite;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.3px),
            calc((var(--mouse-y, 50) - 50) * 0.3px)
          );
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #00ffff 0%, #00bfff 50%, #0080ff 100%);
          bottom: -200px;
          right: -200px;
          animation: float2 30s ease-in-out infinite;
          transform: translate(
            calc((50 - var(--mouse-x, 50)) * 0.4px),
            calc((50 - var(--mouse-y, 50)) * 0.4px)
          );
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .orb-3 {
          width: 450px;
          height: 450px;
          background: linear-gradient(135deg, #ffff00 0%, #ff8c00 50%, #ff4500 100%);
          top: 50%;
          left: 50%;
          transform: translate(
            calc(-50% + (var(--mouse-x, 50) - 50) * 0.5px),
            calc(-50% + (var(--mouse-y, 50) - 50) * 0.5px)
          );
          animation: float3 22s ease-in-out infinite;
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .orb-4 {
          width: 350px;
          height: 350px;
          background: linear-gradient(135deg, #ff00ff 0%, #ff1493 50%, #8b00ff 100%);
          top: 20%;
          right: 10%;
          animation: float4 28s ease-in-out infinite;
          transform: translate(
            calc((50 - var(--mouse-x, 50)) * 0.35px),
            calc((var(--mouse-y, 50) - 50) * 0.35px)
          );
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .orb-5 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #00ff00 0%, #00ff7f 50%, #00ced1 100%);
          bottom: 30%;
          left: 10%;
          animation: float5 26s ease-in-out infinite;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.4px),
            calc((50 - var(--mouse-y, 50)) * 0.4px)
          );
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .floating-shape {
          position: absolute;
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 2;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .shape-1 {
          width: 250px;
          height: 250px;
          top: 10%;
          left: 10%;
          animation: morph1 18s ease-in-out infinite, floatShape1 15s ease-in-out infinite;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.2px),
            calc((var(--mouse-y, 50) - 50) * 0.2px)
          );
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .shape-2 {
          width: 180px;
          height: 180px;
          top: 60%;
          right: 15%;
          animation: morph2 20s ease-in-out infinite, floatShape2 17s ease-in-out infinite;
          transform: translate(
            calc((50 - var(--mouse-x, 50)) * 0.25px),
            calc((var(--mouse-y, 50) - 50) * 0.25px)
          );
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .shape-3 {
          width: 150px;
          height: 150px;
          bottom: 20%;
          left: 20%;
          animation: morph3 22s ease-in-out infinite, floatShape3 19s ease-in-out infinite;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.3px),
            calc((50 - var(--mouse-y, 50)) * 0.3px)
          );
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .shape-4 {
          width: 220px;
          height: 220px;
          top: 30%;
          right: 30%;
          animation: morph4 24s ease-in-out infinite, floatShape4 16s ease-in-out infinite;
          transform: translate(
            calc((50 - var(--mouse-x, 50)) * 0.2px),
            calc((50 - var(--mouse-y, 50)) * 0.2px)
          );
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .shape-5 {
          width: 200px;
          height: 200px;
          bottom: 10%;
          right: 25%;
          animation: morph5 21s ease-in-out infinite, floatShape5 18s ease-in-out infinite;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.25px),
            calc((var(--mouse-y, 50) - 50) * 0.25px)
          );
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .light-ray {
          position: absolute;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(255, 0, 255, 0.3) 20%, 
            rgba(0, 255, 255, 0.4) 50%, 
            rgba(255, 255, 0, 0.3) 80%, 
            transparent 100%);
          filter: blur(2px);
          z-index: 2;
          animation: rayMove 8s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
        }

        .ray-1 {
          left: calc(var(--mouse-x, 50%) - 10%);
          animation-delay: 0s;
          transition: left 0.2s ease-out;
        }

        .ray-2 {
          left: var(--mouse-x, 50%);
          animation-delay: 2.5s;
          transition: left 0.2s ease-out;
        }

        .ray-3 {
          left: calc(var(--mouse-x, 50%) + 10%);
          animation-delay: 5s;
          transition: left 0.2s ease-out;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          z-index: 3;
          animation: particleFloat 12s ease-in-out infinite;
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .particle-1 {
          top: 20%;
          left: 15%;
          background: rgba(255, 0, 255, 0.8);
          box-shadow: 0 0 20px rgba(255, 0, 255, 1), 0 0 40px rgba(255, 0, 255, 0.5);
          animation-delay: 0s;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.15px),
            calc((var(--mouse-y, 50) - 50) * 0.15px)
          );
        }

        .particle-2 {
          top: 40%;
          left: 70%;
          background: rgba(0, 255, 255, 0.8);
          box-shadow: 0 0 20px rgba(0, 255, 255, 1), 0 0 40px rgba(0, 255, 255, 0.5);
          animation-delay: 2s;
          transform: translate(
            calc((50 - var(--mouse-x, 50)) * 0.2px),
            calc((var(--mouse-y, 50) - 50) * 0.2px)
          );
        }

        .particle-3 {
          top: 60%;
          left: 30%;
          background: rgba(255, 255, 0, 0.8);
          box-shadow: 0 0 20px rgba(255, 255, 0, 1), 0 0 40px rgba(255, 255, 0, 0.5);
          animation-delay: 4s;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.18px),
            calc((50 - var(--mouse-y, 50)) * 0.18px)
          );
        }

        .particle-4 {
          top: 80%;
          left: 60%;
          background: rgba(255, 0, 150, 0.8);
          box-shadow: 0 0 20px rgba(255, 0, 150, 1), 0 0 40px rgba(255, 0, 150, 0.5);
          animation-delay: 6s;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.22px),
            calc((var(--mouse-y, 50) - 50) * 0.22px)
          );
        }

        .particle-5 {
          top: 30%;
          left: 85%;
          background: rgba(150, 0, 255, 0.8);
          box-shadow: 0 0 20px rgba(150, 0, 255, 1), 0 0 40px rgba(150, 0, 255, 0.5);
          animation-delay: 8s;
          transform: translate(
            calc((50 - var(--mouse-x, 50)) * 0.16px),
            calc((var(--mouse-y, 50) - 50) * 0.16px)
          );
        }

        .particle-6 {
          top: 70%;
          left: 10%;
          background: rgba(0, 255, 150, 0.8);
          box-shadow: 0 0 20px rgba(0, 255, 150, 1), 0 0 40px rgba(0, 255, 150, 0.5);
          animation-delay: 10s;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.19px),
            calc((50 - var(--mouse-y, 50)) * 0.19px)
          );
        }

        .geometric-pattern {
          position: absolute;
          width: 300px;
          height: 300px;
          z-index: 1;
          animation: patternRotate 30s linear infinite;
          transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .pattern-1 {
          top: -150px;
          right: -150px;
          border-radius: 50%;
          border: 3px dashed;
          border-color: rgba(255, 0, 255, 0.4) rgba(0, 255, 255, 0.4) rgba(255, 255, 0, 0.4) rgba(255, 0, 150, 0.4);
          box-shadow: 0 0 30px rgba(255, 0, 255, 0.3);
          transform: translate(
            calc((50 - var(--mouse-x, 50)) * 0.4px),
            calc((var(--mouse-y, 50) - 50) * 0.4px)
          ) rotate(calc((var(--mouse-x, 50) - 50) * 0.2deg));
        }

        .pattern-2 {
          bottom: -150px;
          left: -150px;
          border-radius: 50%;
          border: 3px dashed;
          border-color: rgba(0, 255, 255, 0.4) rgba(255, 0, 255, 0.4) rgba(255, 255, 0, 0.4) rgba(0, 255, 150, 0.4);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
          animation-direction: reverse;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.4px),
            calc((50 - var(--mouse-y, 50)) * 0.4px)
          ) rotate(calc((50 - var(--mouse-x, 50)) * 0.2deg));
        }

        .glass-panel {
          position: absolute;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 0, 255, 0.3);
          border-radius: 20px;
          z-index: 2;
          animation: glassFloat 20s ease-in-out infinite;
          box-shadow: 0 8px 32px rgba(255, 0, 255, 0.2);
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .panel-1 {
          top: 15%;
          right: 20%;
          animation-delay: 0s;
          transform: translate(
            calc((50 - var(--mouse-x, 50)) * 0.3px),
            calc((var(--mouse-y, 50) - 50) * 0.3px)
          ) rotate(calc((var(--mouse-x, 50) - 50) * 0.1deg));
        }

        .panel-2 {
          bottom: 15%;
          left: 25%;
          animation-delay: 10s;
          transform: translate(
            calc((var(--mouse-x, 50) - 50) * 0.3px),
            calc((50 - var(--mouse-y, 50)) * 0.3px)
          ) rotate(calc((50 - var(--mouse-x, 50)) * 0.1deg));
        }

        @keyframes meshMove {
          0%, 100% {
            background-position: 0% 0%;
          }
          25% {
            background-position: 100% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          75% {
            background-position: 0% 100%;
          }
        }

        @keyframes backgroundShift {
          0%, 100% {
            background-position: 0% 0%, 0% 0%, 0% 0%, 0% 50%;
          }
          25% {
            background-position: 0% 0%, 0% 0%, 0% 0%, 100% 0%;
          }
          50% {
            background-position: 0% 0%, 0% 0%, 0% 0%, 100% 100%;
          }
          75% {
            background-position: 0% 0%, 0% 0%, 0% 0%, 0% 100%;
          }
        }

        @keyframes float1 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(150px, 200px) scale(1.2) rotate(90deg);
          }
          50% {
            transform: translate(-100px, 250px) scale(0.8) rotate(180deg);
          }
          75% {
            transform: translate(200px, 100px) scale(1.1) rotate(270deg);
          }
        }

        @keyframes float2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(-180px, -150px) scale(1.3) rotate(-90deg);
          }
          50% {
            transform: translate(120px, -200px) scale(0.7) rotate(-180deg);
          }
          75% {
            transform: translate(-200px, -100px) scale(1.15) rotate(-270deg);
          }
        }

        @keyframes float3 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(-40%, -60%) scale(1.3) rotate(90deg);
          }
          50% {
            transform: translate(-60%, -40%) scale(0.7) rotate(180deg);
          }
          75% {
            transform: translate(-45%, -55%) scale(1.2) rotate(270deg);
          }
        }

        @keyframes float4 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(100px, 150px) scale(1.25) rotate(120deg);
          }
          66% {
            transform: translate(-80px, 100px) scale(0.85) rotate(240deg);
          }
        }

        @keyframes float5 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(-120px, -100px) scale(1.2) rotate(-120deg);
          }
          66% {
            transform: translate(100px, -150px) scale(0.9) rotate(-240deg);
          }
        }

        @keyframes morph1 {
          0%, 100% {
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            transform: rotate(0deg);
          }
          25% {
            border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
            transform: rotate(90deg);
          }
          50% {
            border-radius: 30% 70% 70% 30% / 70% 30% 30% 70%;
            transform: rotate(180deg);
          }
          75% {
            border-radius: 70% 30% 30% 70% / 30% 70% 70% 30%;
            transform: rotate(270deg);
          }
        }

        @keyframes morph2 {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: rotate(0deg);
          }
          25% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: rotate(-90deg);
          }
          50% {
            border-radius: 70% 30% 40% 60% / 30% 40% 60% 70%;
            transform: rotate(-180deg);
          }
          75% {
            border-radius: 40% 70% 60% 30% / 70% 30% 40% 60%;
            transform: rotate(-270deg);
          }
        }

        @keyframes morph3 {
          0%, 100% {
            border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
            transform: rotate(0deg);
          }
          25% {
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            transform: rotate(45deg);
          }
          50% {
            border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
            transform: rotate(90deg);
          }
          75% {
            border-radius: 40% 60% 60% 40% / 60% 40% 40% 60%;
            transform: rotate(135deg);
          }
        }

        @keyframes morph4 {
          0%, 100% {
            border-radius: 40% 60% 60% 40% / 60% 40% 40% 60%;
            transform: rotate(0deg);
          }
          25% {
            border-radius: 60% 40% 40% 60% / 40% 60% 60% 40%;
            transform: rotate(-45deg);
          }
          50% {
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            transform: rotate(-90deg);
          }
          75% {
            border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
            transform: rotate(-135deg);
          }
        }

        @keyframes morph5 {
          0%, 100% {
            border-radius: 45% 55% 55% 45% / 55% 45% 45% 55%;
            transform: rotate(0deg);
          }
          33% {
            border-radius: 55% 45% 45% 55% / 45% 55% 55% 45%;
            transform: rotate(120deg);
          }
          66% {
            border-radius: 35% 65% 65% 35% / 65% 35% 35% 65%;
            transform: rotate(240deg);
          }
        }

        @keyframes floatShape1 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(50px, -60px);
          }
        }

        @keyframes floatShape2 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-60px, 50px);
          }
        }

        @keyframes floatShape3 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(70px, -50px);
          }
        }

        @keyframes floatShape4 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-50px, 70px);
          }
        }

        @keyframes floatShape5 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(40px, 60px);
          }
        }

        @keyframes rayMove {
          0%, 100% {
            opacity: 0;
            transform: translateX(0) scaleY(0.5);
          }
          50% {
          opacity: 1;
            transform: translateX(20px) scaleY(1);
          }
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(30px, -40px) scale(1.5);
            opacity: 1;
          }
          50% {
            transform: translate(-20px, -60px) scale(0.8);
            opacity: 0.8;
          }
          75% {
            transform: translate(40px, -30px) scale(1.2);
            opacity: 0.9;
          }
        }

        @keyframes patternRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes glassFloat {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.03;
          }
          50% {
            transform: translate(40px, -50px) rotate(5deg);
            opacity: 0.08;
          }
        }
      `}</style>
    </div>
  );
}
