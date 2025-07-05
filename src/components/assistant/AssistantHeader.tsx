import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, X, User, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";  //animation

interface AssistantHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  initials: string;
  firstName: string;
}

const AssistantHeader = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  handleLogout, 
  initials, 
  firstName 
}: AssistantHeaderProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <motion.div
  className="h-16 bg-white dark:bg-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 relative z-10"
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
>

      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-10 w-10 p-0 rounded-lg"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-lg italic font-medium text-gray-900 dark:text-white">
            <img src="public\logo.png" alt="Wheely Logo" className="w-25 h-8" />
            <p className="font-bold dark:text-white">Wheely</p>
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
          className="h-10 w-10 rounded-full flex items-center justify-center text-gray-600 dark:text-yellow-400 dark:bg-gray-800 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border-gray-200 shadow-lg" align="end">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{firstName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300"></p>
              <Badge variant="secondary" className="mt-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 text-xs">
               Dealer
              </Badge>
            </div>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem className="text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem 
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700"
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