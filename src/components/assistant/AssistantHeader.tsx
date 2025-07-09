import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, X, User, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";  //animation
import { supabase } from "@/lib/supabaseClient"; 

interface AssistantHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  initials: string;
  email: string;
  username: string; // ✅ add this
  role: string;
}

const AssistantHeader = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  handleLogout, 
  initials, 
  email: initialEmail,
  role,
  username
}: AssistantHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    const fetchEmail = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("username", username)
        .single();

      if (data) setEmail(data.email);
      if (error) console.error("Error fetching email from Supabase:", error);
    };

    if (username && !initialEmail) {
      fetchEmail();
    }
  }, [username, initialEmail]);

  return (
    <motion.div
      className="h-16 bg-white dark:bg-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 relative z-10"
      style={{ background: undefined }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-lg italic font-medium text-gray-900 dark:text-white">
          <img
              src={theme === "dark" ? "public/wheely_white.png" : "public/orange_logo.png"}
              alt="Wheely Logo"
              className="w-40 h-18"
/>

            {/* <p className="font-bold dark:text-white">Wheely</p> */}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Dark Mode Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-10 w-10 rounded-full flex items-center justify-center text-gray-600 dark:text-yellow-400 dark:bg-gray-800 bg-gray-100"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
              <AvatarFallback
                  className={`text-sm font-medium ${
                    theme === "dark"
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
           {initials}
      </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg" align="end">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{email}</p>
              <Badge variant="secondary" className="mt-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 text-xs">
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Role"}
              </Badge>
            </div>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem className="text-gray-700 dark:text-white">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-700 dark:text-white">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem 
              className="text-red-600 dark:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default AssistantHeader; 