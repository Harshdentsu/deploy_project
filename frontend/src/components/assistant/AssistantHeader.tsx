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
import { Menu, X, User, Settings, LogOut, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface AssistantHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  email: string;
  username: string;
  role: string;
  salesRepId?: string;
}

const AssistantHeader = ({
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
  email: initialEmail,
  role,
  username,
  salesRepId,
}: AssistantHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState(initialEmail);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fetch notifications for sales rep
    if (role === "sales_rep" && salesRepId) {
      fetch(`http://localhost:8000/api/salesrep-notifications/${salesRepId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setNotifications(data.notifications);
        });
    }
  }, [role, salesRepId]);

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

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
      setNotifOpen(false);
    }
  };

  if (notifOpen) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [notifOpen]);


  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/[\s._-]+/);
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleAccept = (requestId: string) => {
    fetch('http://localhost:8000/api/salesrep-notifications/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId }),
    }).then(() => {
      setNotifications((prev) => prev.filter(n => n.request_id !== requestId));
    });
  };

  const handleDismiss = (requestId: string) => {
    fetch('http://localhost:8000/api/salesrep-notifications/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId }),
    }).then(() => {
      setNotifications((prev) => prev.filter(n => n.request_id !== requestId));
    });
  };

  const fetchNotifications = () => {
    if (role === "sales_rep" && salesRepId) {
      fetch(`/api/salesrep-notifications/${salesRepId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setNotifications(data.notifications);
        });
    }
  };
  return (
    <motion.header
      className="h-16 w-full bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-black dark:via-neutral-900 dark:to-black dark:text-slate-100 border-b border-gray-200 dark:border-neutral-900 flex items-center justify-between px-3 sm:px-5 md:px-8 py-2 z-50 relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {/* Left section */}
      <div className="flex items-center space-x-3">
        {/* Hamburger menu */}
        <button
          className="md:hidden text-gray-700 dark:text-slate-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logos */}
        <div className="flex items-center space-x-1">
          <img
            src="/logo2.png"
            alt="Logo 2"
            className="h-6 sm:h-8 md:h-10 lg:h-10 w-auto object-contain"
          />
          <img
            src="/trial.png"
            alt="Wheely Logo"
            className="h-5 sm:h-7 md:h-9 lg:h-9 pt-1 w-auto object-contain"
          />
        </div>
      </div>

      {/* Center section: Chat Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100 tracking-tight select-none">
          Assistant Chat
        </span>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-gray-600 dark:text-yellow-400 dark:bg-orange-800 bg-orange-100"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center relative"
          onClick={() => setNotifOpen((open) => !open)}
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs px-1">
              {notifications.length}
            </span>
          )}
        </Button>
        {notifOpen && (
         
          <div  ref={notifRef} className="absolute right-16 top-14 w-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-lg rounded-lg z-50">
            <div className="p-4">
              <h4 className="font-semibold mb-2">Notifications</h4>
              {notifications.length === 0 ? (
                <div className="text-sm text-gray-500">No new notifications</div>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className="mb-2 p-2 rounded bg-orange-50 dark:bg-neutral-800">
                    <div className="font-medium">
                      <span className="font-semibold">{notif.dealer_name}</span> requested <span className="font-semibold">{notif.quantity}</span> units of <span className="font-semibold">{notif.product_name}</span>
                    </div>
                    <div className="text-xs text-gray-500">{notif.created_at}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                        onClick={() => handleAccept(notif.request_id)}
                      >Accept</button>
                      <button
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                        onClick={() => handleDismiss(notif.request_id)}
                      >Dismiss</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
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
            className="w-56 bg-white dark:bg-black border border-gray-200 dark:border-neutral-900 shadow-lg"
            align="end"
          >
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
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
    </motion.header>
  );
};

export default AssistantHeader;
