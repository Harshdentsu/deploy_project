import { useState, useEffect, useRef } from "react";
import { MoreVertical, SquarePen, BarChart2, PanelRight } from "lucide-react";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: any[];
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  chats: Chat[];
  currentChatId: string;
  setCurrentChatId: (id: string) => void;
  handleNewChat: () => void;
  handleDeleteChat: (id: string) => void;
  navigate: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  chats,
  currentChatId,
  setCurrentChatId,
  handleNewChat,
  handleDeleteChat,
  navigate,
}) => {
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-sm ${sidebarOpen ? 'w-48' : 'w-16'} overflow-hidden`}>
      {/* Top: Toggle Button */}
      <div className="flex items-center justify-end px-3 pt-4 pb-2">
        <button
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle sidebar"
        >
          <PanelRight className="w-6 h-6" />
        </button>
      </div>

      {/* New Chat & Analytics */}
      <div className="flex flex-col gap-2 mt-2 px-2">
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm transition-all duration-200 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          onClick={handleNewChat}
          title="New Chat"
        >
          <SquarePen className="h-5 w-5 opacity-80" />
          {sidebarOpen && <span className="text-sm font-medium">New Chat</span>}
        </button>

        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm transition-all duration-200 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          onClick={() => navigate('/analytics')}
          title="Analytics"
        >
          <BarChart2 className="h-5 w-5 opacity-80" />
          {sidebarOpen && <span className="text-sm font-medium">Analytics</span>}
        </button>
      </div>

      {/* Conversations List */}
      <div className={`mt-6 flex-1 flex flex-col overflow-y-auto ${sidebarOpen ? '' : 'items-center'}`}>
        {sidebarOpen && <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-2">Chats</h3>}
        <ul className="flex-1 w-full">
          {chats.map(chat => (
            <li
              key={chat.id}
              className={`group flex items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center'} py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer ${chat.id === currentChatId ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <span
                className={`truncate text-sm font-medium ${sidebarOpen ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-100'} ${sidebarOpen ? '' : 'sr-only'}`}
                onClick={() => setCurrentChatId(chat.id)}
                title={chat.title}
              >
                {chat.title}
              </span>
              <div className="relative flex items-center" ref={menuRef}>
                <button
                  className={`ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition ${sidebarOpen ? '' : 'mx-auto'}`}
                  onClick={() => setShowMenuId(showMenuId === chat.id ? null : chat.id)}
                  title="More options"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                </button>

                {/* Dropdown menu */}
                {showMenuId === chat.id && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-800 hover:text-red-700 rounded-md transition-all"
                      onClick={() => { handleDeleteChat(chat.id); setShowMenuId(null); }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
