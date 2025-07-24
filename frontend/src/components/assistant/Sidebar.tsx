import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import {
  MoreVertical,
  BarChart2,
  PanelLeft,
  PanelRight,
} from "lucide-react";

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
  const buttonRefs = useRef<{ [id: string]: HTMLButtonElement | null }>({});
  

   useEffect(() => {
    const ids = chats.map(c => c.id);
    const unique = new Set(ids);
    if (ids.length !== unique.size) {
      console.warn("Duplicate chat IDs found!", ids);
    }
  }, [chats]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if ((event.target as HTMLElement).closest('.sidebar-floating-menu')) return;
      setShowMenuId(null);
      setMenuPosition(null);
    }

    if (showMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenuId]);

  return (
    <div className={`h-screen flex flex-col transition-all duration-300 bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:bg-gradient-to-br dark:from-black dark:via-neutral-900 dark:to-black border-r border-gray-200 dark:border-neutral-900 shadow-sm ${sidebarOpen ? 'w-48 sm:w-56' : 'w-16 sm:w-20'} overflow-hidden`}>
      
      {/* Toggle Button */}
      <div className="flex items-center justify-center px-2 pt-4 pb-2">
        <div
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <PanelLeft className="w-7 h-7 text-black-600 dark:text-slate-200" />
          ) : (
            <PanelRight className="w-7 h-7 text-black-600 dark:text-slate-200" />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-2 px-2">
        {/* New Chat Button with Tooltip */}
        <div className={sidebarOpen ? '' : 'flex justify-center'}>
          <div className={sidebarOpen ? '' : 'group relative'}>
            <button
              onClick={handleNewChat}
              className={`flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition duration-150 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              title="New Chat"
            >
              <FontAwesomeIcon icon={faMessage} />
              {sidebarOpen && <span className="text-sm font-medium">New Chat</span>}
            </button>
            {!sidebarOpen && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                New Chat
              </span>
            )}
          </div>
        </div>
        {/* Analytics Button with Tooltip */}
        <div className={sidebarOpen ? '' : 'flex justify-center'}>
          <div className={sidebarOpen ? '' : 'group relative'}>
            <button
              onClick={() => navigate('/analytics')}
              className={`flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition duration-150 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              title="Analytics"
            >
              <BarChart2 className="h-5 w-5" />
              {sidebarOpen && <span className="text-sm font-medium">Analytics</span>}
            </button>
            {!sidebarOpen && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                Analytics
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className={`mt-6 flex-1 flex flex-col overflow-y-auto ${sidebarOpen ? '' : 'items-center'}`}>
        {sidebarOpen && (
          <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-2">Chats</h3>
        )}

        <ul className="flex-1 w-full space-y-1">
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              className={`group flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded cursor-pointer ${chat.id === currentChatId ? 'bg-gray-100 dark:bg-neutral-900' : ''}`}
            >
              <span
                className={`truncate text-sm font-medium ${sidebarOpen ? 'text-gray-900 dark:text-slate-100' : 'sr-only'}`}
                title={chat.title}
              >
                {chat.title}
              </span>

              {sidebarOpen && (
                <div className="relative flex items-center" onClick={e => e.stopPropagation()}>
                  <button
                    ref={el => buttonRefs.current[chat.id] = el}
                    onClick={e => {
                      e.stopPropagation();
                      if (showMenuId === chat.id) {
                        setShowMenuId(null);
                        setMenuPosition(null);
                      } else {
                        const rect = buttonRefs.current[chat.id]?.getBoundingClientRect();
                        if (rect) {
                          setMenuPosition({
                            top: rect.top + rect.height / 2,
                            left: rect.right + 8
                          });
                        }
                        setShowMenuId(chat.id);
                      }
                    }}
                    title="More options"
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Floating Delete Menu */}
        {showMenuId && menuPosition && (
          <div
            className="sidebar-floating-menu fixed z-50 w-32 bg-white dark:bg-black border border-gray-200 dark:border-neutral-900 rounded-md shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left, transform: 'translateY(-50%)' }}
          >
            <button
              onClick={() => {
                handleDeleteChat(showMenuId);
                setShowMenuId(null);
                setMenuPosition(null);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-800"
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