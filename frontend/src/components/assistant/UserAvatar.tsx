import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";

interface UserAvatarProps {
  username: string;
  className?: string;
}

const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s|\.|_|-/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar = ({ username, className = "h-10 w-10" }: UserAvatarProps) => {
  const { theme } = useTheme();
  return (
    <Avatar className={className}>
      <AvatarFallback
        className={`text-sm font-medium ${theme === "dark"
          ? "bg-orange-700 text-white"
          : "bg-orange-400 text-white"
        }`}
      >
        {getInitials(username)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
