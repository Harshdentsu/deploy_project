import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => { setTheme('light'); }, [setTheme]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Request backend to send verification link (token will be generated and stored in DB)
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/send-verification-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        toast({
          title: "Verification Email Sent!",
          description: "Please check your email and click the verification link"
        });
        // After successful signup and login (if your signup flow logs in the user automatically):
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send verification email",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-0">
        <div className="w-full max-w-xl flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-white/80 dark:bg-gray-900/80 rounded-full flex items-center justify-center shadow-lg">
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Check Your Email</h1>
            <p className="text-gray-700 dark:text-gray-300 text-base">We've sent a verification link to your email</p>
          </div>
          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl px-8 py-2 w-full">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Verification email sent to:</h3>
                <p className="text-blue-900 dark:text-blue-300 font-medium">{email}</p>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Click the link in your email to verify your account and complete the signup process.
                </p>
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl shadow-lg focus:ring-4 focus:ring-orange-300"
                  >
                    Use Different Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-center text-sm text-gray-700 dark:text-gray-300 mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-orange-600 dark:text-orange-400 font-medium"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-0">
      <div className="w-full max-w-md flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-12 h-12 dark:bg-gray-900/80 rounded-full flex items-center justify-center shadow-lg">
            <img
              src="/logo3.png"
              alt="Wheely Logo"
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
            />

          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create Account</h1>
          <p className="text-gray-700 dark:text-gray-300 text-base">Join the Wheely Assistant</p>
        </div>
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl px-8 py-2 w-full">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl text-gray-900 dark:text-white">Email Verification</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Enter your email to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
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
                {isLoading ? "Sending..." : "Send Verification Link"}
              </Button>
            </form>
            <div className="text-center text-sm text-gray-700 dark:text-gray-300 mt-6">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-orange-600 dark:text-orange-400 font-medium"
              >
                Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
