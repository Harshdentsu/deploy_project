import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    password: "",
    role: ""
  });
  const { setTheme } = useTheme();

  useEffect(() => { setTheme('light'); }, [setTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role
        }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userId", data.user.user_id?.toString() || "");
        toast({
          title: "Welcome back!",
          description: "Logging you in..."
        });
        if (data.user && data.user.role === formData.role) {
          toast({
            title: "Account Setup Complete!",
            description: "Welcome to Wheely Assistant",
            duration:2000
          });
          setTimeout(() => {
            navigate('/assistant');
          }, 1000);
        } else {
          toast({
            title: "Role Mismatch",
            description: "Your selected role does not match your assigned role.",
            variant: "destructive"
          });
        }
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-0">
      <div className="w-full max-w-md flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-white/80 dark:bg-gray-900/80 rounded-full flex items-center justify-center shadow-lg">
            <img src="public/logo.png" alt="Wheely Logo" className="h-10 w-10" />
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
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
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

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Role
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({...formData, role: value})}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-12 border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="dealer">Dealer</SelectItem>
                    <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-orange-600 dark:text-orange-400 font-medium"
                  disabled={isLoading}
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
