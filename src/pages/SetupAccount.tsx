import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

const SetupAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: ""
  });
  const { setTheme } = useTheme();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast({
        title: "Invalid Access",
        description: "Verification token missing",
        variant: "destructive"
      });
      navigate('/signup');
      return;
    }
  
    const verifyToken = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token })
        });
  
        const result = await response.json();
  
        if (result.success) {
          setEmail(result.email);  // ✅ this sets the actual email from backend
        } else {
          toast({
            title: "Verification Failed",
            description: result.message || "Invalid or expired link",
            variant: "destructive"
          });
          navigate('/signup');
        }
      } catch (err) {
        console.error("Token verification error:", err);
        toast({
          title: "Verification Failed",
          description: "Error verifying your email",
          variant: "destructive"
        });
        navigate('/signup');
      }
    };
  
    verifyToken();
  }, [searchParams, navigate, toast]);
  
  useEffect(() => { setTheme('light'); }, [setTheme]);

  const handleSetupComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Setup account
      console.log("Setup payload:", { email, ...formData });
      const setupRes = await fetch('http://localhost:8000/api/setup-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...formData }),
      });
      const setupData = await setupRes.json();

      if (!setupData.success) {
        toast({
          title: "Setup Failed",
          description: setupData.message || "Could not complete account setup",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      toast({
        title: "Account Setup Complete!",
        description: "Welcome to Wheely Assistant"
      });
      setTimeout(() => {
        navigate('/assistant');
      }, 1000);
    } catch (error) {
      toast({
        title: "Setup/Login Failed",
        description: "Something went wrong during account setup or login",
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Setup Your Account</h1>
          <p className="text-gray-700 dark:text-gray-300 text-base">Complete your profile for {email}</p>
        </div>
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl px-8 py-2 w-full">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl text-gray-900 dark:text-white">Account Information</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Set up your username, password, and role</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupComplete} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
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
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
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
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl shadow-lg focus:ring-4 focus:ring-orange-300"
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupAccount;
