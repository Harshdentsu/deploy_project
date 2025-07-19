import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, X, User, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface AssistantHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  email: string;
  username: string;
  role: string;
}

const AssistantHeader = ({
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
  email: initialEmail,
  role,
  username,
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

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/[\s._-]+/);
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <motion.div
      className="h-16 w-full bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 py-2 z-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Hamburger */}
        <button
          className="md:hidden text-gray-700 dark:text-white mr-3"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <div className="flex items-center text-lg italic font-medium text-gray-900 dark:text-white">
        <div className="absolute top-4 left-2 z-50 flex items-center space-x-1">
        {/* Logo 2 - slightly larger */}
        <img
          src="/logo2.png"
          alt="Logo 2"
          className="h-5 sm:h-10 md:h-14 lg:h-8 w-auto  object-contain"
        />
        {/* Trial Logo */}
        <img
          src="/trial.png"
          alt="Wheely Logo"
          className="h-5 sm:h-8 md:h-12 lg:h-10 pt-2 w-auto object-contain"
        />
      </div>

        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-10 w-10 rounded-full flex items-center justify-center text-gray-600 dark:text-yellow-400 dark:bg-orange-800 bg-orange-100"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className={`text-sm font-medium ${theme === "dark"
                      ? "bg-orange-700 text-white"
                      : "bg-orange-400 text-white"
                    }`}
                >
                  {getInitials(username)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
            align="end"
          >
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {email}
              </p>
              <Badge
                variant="secondary"
                className="mt-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 text-xs"
              >
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
