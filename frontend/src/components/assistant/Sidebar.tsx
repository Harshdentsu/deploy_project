import { useState, useEffect, useRef } from "react";
import { MoreVertical, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [hoveringLogo, setHoveringLogo] = useState(false);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Hide menu on outside click
  useEffect(() => {
    if (!showMenuId) return;
    function handleClickOutside(event: MouseEvent) {
      if ((event.target as HTMLElement).closest('.sidebar-floating-menu')) return;
      setShowMenuId(null);
      setMenuPosition(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenuId]);

  return (
    <div className={`transition-all duration-300 bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-sm ${sidebarOpen ? 'w-48 sm:w-56' : 'w-16 sm:w-20'} overflow-hidden`}>
      
      {/* Logo / Toggle Button */}
      <div
        className="flex items-center justify-center px-2 pt-2 pb-2 cursor-pointer"
        onMouseEnter={() => setHoveringLogo(true)}
        onMouseLeave={() => setHoveringLogo(false)}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Toggle sidebar"
      >
        {!hoveringLogo ? (
          <img
            src="/logo3.png"
            alt="Logo"
            className="h-12 w-auto object-contain"
          />
        ) : (
          <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </div>
        )}
      </div>

      {/* New Chat & Analytics Buttons */}
      <div className="flex flex-col gap-2 mt-2 px-2">
        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          onClick={handleNewChat}
          title="New Chat"
        >
          <img src="/new_chat.png" alt="New Chat" className="h-5 w-5" />
          {sidebarOpen && <span className="text-sm font-medium">New Chat</span>}
        </button>

        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          onClick={() => navigate('/analytics')}
          title="Analytics"
        >
          <BarChart2 className="h-5 w-5" />
          {sidebarOpen && <span className="text-sm font-medium">Analytics</span>}
        </button>
      </div>

      {/* Chat List */}
      <div className={`mt-6 flex-1 flex flex-col overflow-y-auto ${sidebarOpen ? '' : 'items-center'}`}>
        {sidebarOpen && (
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-2">Chats</h3>
        )}
        <ul className="flex-1 w-full space-y-1">
          {chats.map((chat, idx) => (
            <li
              key={chat.id}
              className={`group flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer ${chat.id === currentChatId ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => setCurrentChatId(chat.id)}
              style={{ cursor: 'pointer' }}
            >
              <span
                className={`truncate text-sm font-medium ${sidebarOpen ? 'text-gray-900 dark:text-white' : 'sr-only'}`}
                title={chat.title}
              >
                {chat.title}
              </span>

              {sidebarOpen && (
                <div className="relative flex items-center" onClick={e => e.stopPropagation()}>
                  <button
                    ref={el => buttonRefs.current[idx] = el}
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={e => {
                      e.stopPropagation();
                      if (showMenuId === chat.id) {
                        setShowMenuId(null);
                        setMenuPosition(null);
                      } else {
                        const rect = buttonRefs.current[idx]?.getBoundingClientRect();
                        if (rect) {
                          setMenuPosition({
                            top: rect.top + rect.height / 2,
                            left: rect.right + 8 // 8px gap to the right
                          });
                        }
                        setShowMenuId(chat.id);
                      }
                    }}
                    title="More options"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {/* Floating delete menu rendered at fixed position */}
        {showMenuId && menuPosition && (
          <div
            className="sidebar-floating-menu fixed z-50 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left, transform: 'translateY(-50%)' }}
          >
            <button
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-800 "
              onClick={() => {
                handleDeleteChat(showMenuId);
                setShowMenuId(null);
                setMenuPosition(null);
              }}
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
