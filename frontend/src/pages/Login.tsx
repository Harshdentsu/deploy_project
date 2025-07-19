import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const { setTheme } = useTheme();

  useEffect(() => { setTheme('light'); }, [setTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userId", data.user.user_id?.toString() || "");
        localStorage.setItem("user", JSON.stringify(data.user));
        toast({
          title: "Welcome back!",
          description: "Logging you in..."
        });
        toast({
          title: "Account Setup Complete!",
          description: "Welcome to Wheely Assistant",
          duration: 2000
        });
        setTimeout(() => {
          console.log("✅ Navigating to /assistant...");
          console.log("✅ Saved user:", localStorage.getItem("user"));
          navigate('/assistant');
        }, 1000);
      } else {
        toast({
          title: "Invalid Credentials",
          description: data.message || "Username, password, or role is incorrect.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Could not connect to server.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 sm:px-0 bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center justify-center py-8">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
            <img src="/logo3.png" alt="Wheely Logo" className="h-full w-auto object-contain" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
          <p className="text-gray-700 dark:text-gray-300 text-base">Sign in to your account</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl px-8 py-2 w-full">
          <CardHeader className="text-center ">
            <CardTitle className="text-xl dark:text-white">Sign In</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  autoComplete="new-username"
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-12 border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    autoComplete="new-password"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-orange-600 dark:text-orange-400 font-medium"
                  disabled={isLoading}
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl shadow-lg focus:ring-4 focus:ring-orange-300"
              >
                {isLoading ? "Signing In..." : "Sign In"}
                <ArrowRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
              </Button>

              <div className="text-center text-sm ">
                New user?{" "}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-orange-600 dark:text-orange-400 font-medium"
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
