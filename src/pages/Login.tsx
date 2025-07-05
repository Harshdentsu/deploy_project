import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      console.log('🔐 Attempting secure login...');
      
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
        console.log('✅ Login successful:', data.user);
        
        // Save user info to localStorage/session as needed
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
        console.error('❌ Login failed:', data.message);
        toast({
          title: "Invalid Credentials",
          description: data.message || "Username, password, or role is incorrect.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
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
    <div className="min-h-screen bg-[#fffffe] flex items-center justify-center ">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
          <img src="public/logo.png" alt="Wheely Logo" className="h-54 w-54" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-[#0d0d0d]">Sign in to your account</p>
        </div>

        <Card className="border-0 shadow-xl bg-[#eff0f3] backdrop-blur-sm">
          <CardHeader className="text-center ">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription className="text-[#2a2a2a]" >Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
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
                  className="h-12 border-[#0d0d0d] focus:border-purple-500 focus:ring-purple-500 "
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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
                    className="h-12 border-[#0d0d0d]  focus:border-purple-500 focus:ring-purple-500 pr-10"
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
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({...formData, role: value})}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-12 border-[#0d0d0d]  focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="dealer">Dealer</SelectItem>
                    <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-gray-800 font-medium"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#ff8e3c] text-[#fffffe] font-medium rounded-lg shadow-lg"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                New user?{" "}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-[#d9376e] font-medium"
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
