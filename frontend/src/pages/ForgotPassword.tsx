import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await response.json(); // Always show generic success
      toast({
        title: "Check your email",
        description: "If an account exists, a reset link has been sent.",
      });
    } catch (error) {
      toast({
        title: "Request Failed",
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
          <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
            <img src="/logo3.png" alt="Wheely Logo" className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Forgot Password?</h1>
          <p className="text-gray-700 dark:text-gray-300 text-base">Enter your email to receive a reset link</p>
        </div>
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl px-8 py-2 w-full">
          <CardHeader className="text-center ">
            <CardTitle className="text-xl dark:text-white">Reset Password</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">We'll send you a link to reset your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl shadow-lg focus:ring-4 focus:ring-orange-300"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="text-center text-sm ">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-orange-600 dark:text-orange-400 font-medium"
                  disabled={isLoading}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword; 