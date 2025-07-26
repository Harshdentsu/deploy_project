import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AssistantHeader from "@/components/assistant/AssistantHeader";
import ChatInput from "@/components/assistant/ChatInput";
import ChatMessages from "@/components/assistant/ChatMessages";
import SuggestedQueriesSidebar from "@/components/assistant/SuggestedQueriesSidebar";
import Sidebar from "@/components/assistant/Sidebar";
import { useToast } from "@/hooks/use-toast";
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

const ChatAssistant = () => {
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState("1");
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(true);
  const [showSuggestedQueries, setShowSuggestedQueries] = useState(true);
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "New chat",
      lastMessage: "",
      timestamp: new Date(),
      messages: []
    }
  ]);
  // Helper to get user-specific chat key
  const getChatKey = () => {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : {};
    const email = user.email || localStorage.getItem("username") || "guest";
    return `wheely_chats_${email}`;
  };

  // Load chats from localStorage on mount (user-specific)
  useEffect(() => {
    const chatKey = getChatKey();
    const savedChats = localStorage.getItem(chatKey);
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        if (Array.isArray(parsed)) setChats(parsed);
      } catch { }
    }
  }, []);

  // Save chats to localStorage whenever they change (user-specific)
  useEffect(() => {
    const chatKey = getChatKey();
    localStorage.setItem(chatKey, JSON.stringify(chats));
  }, [chats]);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const hasMessages = currentChat?.messages && currentChat.messages.length > 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : {};
  const email = user.email || "";
  const role = user.role || localStorage.getItem("userRole") || "";
  const username = user.username || localStorage.getItem("username") || "";
  const { toast } = useToast();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const roleBasedQueries = {
    dealer: [
      { text: "Claim Status", value: "Show me my all claim details", iconImage: "/claim.png" },
      { text: " SKU Availability", value: "stocks of ", iconImage: "/growth.png" },
      { text: "Similar Products ", value: "Show me the similar products to", iconImage: "/sku.png" },
      { text: "  Order Request", value: "Place an order of ", iconImage: "/box.png" }
    ],
    admin: [
      { text: "List all sales reps" },
      { text: "Show dealer performance" },
      { text: "Add a new SKU" }
    ],
    sales_rep: [
      { text: "Assigned Dealers", value: "Dealers assigned to me", iconImage: "/user1.png" },
      { text: "SKU Availability", value: "Show me stocks of ", iconImage: "/trend.png" },
      { text: " Place an Order", value: "Place an order of ", iconImage: "/box.png" },
      { text: "Monthly Performance", value: "Show me monthly performance", iconImage: "/award.png" }
    ],
    default: [
      { text: "Tell me about the product", icon: "📦" }
    ]
  };

  const normalizedRole = (role || "").toLowerCase();
  const suggestedQueries = roleBasedQueries[normalizedRole] || roleBasedQueries.default;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentChat?.messages]);

  // Track newly created chat IDs in this session
  const newChatIdsRef = useRef<Set<string>>(new Set());

  // When a new chat is created, add its ID to the set
  useEffect(() => {
    if (!chats.some(chat => chat.id === currentChatId)) return;
    const current = chats.find(chat => chat.id === currentChatId);
    if (current && current.messages.length === 0 && !newChatIdsRef.current.has(currentChatId)) {
      newChatIdsRef.current.add(currentChatId);
    }
  }, [chats, currentChatId]);

  // Helper to format username for greeting
  const getFormattedName = () => {
    if (!username) return 'there';
    const parts = username.split('.');
    return parts
      .map(
        part => part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(' ');
  };

  // Show greeting message only for new chats created in this session
  useEffect(() => {
    if (
      currentChat &&
      currentChat.messages.length === 0 &&
      newChatIdsRef.current.has(currentChatId)
    ) {
      const greetingMessage: Message = {
        id: 'greeting',
        content: `Hello ${getFormattedName()}, how can I assist you today?`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId && chat.messages.length === 0
          ? { ...chat, messages: [greetingMessage] }
          : chat
      ));
      // Remove from set so greeting is only added once
      newChatIdsRef.current.delete(currentChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId, currentChat]);

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;
    const inputWithContext = selectedContext
      ? `Context: ${selectedContext}\nQuery: ${currentInput}`
      : currentInput;
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputWithContext,
      sender: 'user',
      timestamp: new Date()
    };
    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ));
    setCurrentInput("");
    setInputFocused(true);
    setIsTyping(true);
    setShowSuggestedQueries(true);
    setSelectedContext(null);
    try {
      const username = localStorage.getItem("username");
      const response = await fetch(`${API_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, query: userMessage.content }),
      });
      const result = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.success ? result.answer : "Sorry, I can't assist with that.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? {
            ...chat,
            messages: [...chat.messages, assistantMessage],
            lastMessage: assistantMessage.content.substring(0, 50) + "...",
            title: userMessage.content.substring(0, 30) + "..."
          }
          : chat
      ));
    } catch (error) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I can't assist with that.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      ));
    }
    setIsTyping(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
    navigate('/login');
  };

  const handleSuggestedQuery = (query: string) => {
    const cleanedQuery = query.replace(/^[^\w\s]*\s*/, '');
    setCurrentInput(cleanedQuery);
    setInputFocused(true);
    setShowRightPanel(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const length = cleanedQuery.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  const handleContextSelect = (context: string) => {
    setSelectedContext(context);
    setInputFocused(true);
    setShowRightPanel(true);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };
  return (
    <div className="min-h-screen h-screen flex flex-col overflow-hidden bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-[#1A1A1F] dark:to-[#1A1A1F] dark:text-[#F4F4F5]">
      {/* Header always at the top, full width */}
      <div className="sticky top-0 z-50 bg-inherit">
        <AssistantHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
          email={user.email}
          role={role}
          username={username}
          salesRepId={user.sales_rep_id}
        />
      </div>


      {/* Main content area below header: sidebar | chat | suggested queries */}
      <div className="flex-1 flex flex-row min-w-0 overflow-hidden">
        {/* Desktop Sidebar - fixed */}
        <div className="hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 md:min-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[260px] shadow-lg">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            chats={chats}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            handleNewChat={() => {
              const newChatId = Date.now().toString(); // ✅ Safe unique ID
              setChats(prev => [
                ...prev,
                { id: newChatId, title: "New Thread", lastMessage: "", timestamp: new Date(), messages: [] }
              ]);
              setCurrentChatId(newChatId);
              setInputFocused(true);
              setShowRightPanel(true);
              setShowSuggestedQueries(false);
              setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
              }, 100);
            }}
            handleDeleteChat={(chatId) => {
              setChats(prev => {
                const filtered = prev.filter(chat => chat.id !== chatId);
                // If the deleted chat was current, select next or fallback
                if (currentChatId === chatId) {
                  if (filtered.length > 0) {
                    setCurrentChatId(filtered[0].id);
                  } else {
                    setCurrentChatId("1");
                  }
                }
                return filtered;
              });
              setSidebarOpen(false);
            }}
            navigate={navigate}
          />
        </div>

        {/* Spacer for fixed sidebar */}
        <div className="hidden md:block md:min-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[260px]" />

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            {/* Sidebar Panel */}
            <div className="relative z-50 w-4/5 max-w-xs bg-white dark:bg-gray-900 shadow-lg">
              <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                chats={chats}
                currentChatId={currentChatId}
                setCurrentChatId={setCurrentChatId}
                handleNewChat={() => {
                  const newChatId = Date.now().toString(); // or use uuid if available
                  setChats(prev => [
                    ...prev,
                    { id: newChatId, title: "New Thread", lastMessage: "", timestamp: new Date(), messages: [] }
                  ]);
                  setCurrentChatId(newChatId);
                  setInputFocused(true);
                  setShowRightPanel(true);
                  setShowSuggestedQueries(false);
                  setTimeout(() => {
                    if (inputRef.current) inputRef.current.focus();
                  }, 100);
                  setSidebarOpen(false);
                }}
                handleDeleteChat={(chatId) => {
                  setChats(prev => {
                    const filtered = prev.filter(chat => chat.id !== chatId);
                    if (currentChatId === chatId) {
                      if (filtered.length > 0) {
                        setCurrentChatId(filtered[0].id);
                      } else {
                        setCurrentChatId("1");
                      }
                    }
                    return filtered;
                  });
                  setSidebarOpen(false);
                }}
                navigate={navigate}
              />
            </div>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black-400 opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col dark:bg-black-400 dark:text-slate-100 relative transition-all duration-300 min-h-0 w-0">
          <div className="relative dark:text-slate-100 min-h-0  overflow-y-auto px-4 pb-36 pt-4">
            <ChatMessages
              messages={currentChat?.messages || []}
              isTyping={isTyping}
              animatingMessageId={undefined}
              animatedContent={""}
              messagesEndRef={messagesEndRef}
              onContextSelect={handleContextSelect}
              username={username}
            />
            {selectedContext && (
              <div className="max-w-4xl mx-auto mb-2 px-2 sm:px-4">
                <div className="bg-neutral-900/90 text-slate-100 px-4 py-2 rounded-lg flex items-center justify-between text-sm shadow-md border border-neutral-800">
                  <span>Context: <span className="font-semibold text-white">{selectedContext}</span></span>
                  <button
                    className="ml-4 text-xs text-slate-300 hover:underline hover:text-white"
                    onClick={() => setSelectedContext(null)}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
           <div className="fixed bottom-0 left-0 right-0 z-40 dark:bg-[#1A1A1F] border-t border-gray-200 dark:border-gray-700 px-4 py-3">
               <div className="max-w-4xl mx-auto">
                <ChatInput
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                  handleSendMessage={handleSendMessage}
                  isTyping={isTyping}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Queries Sidebar (desktop) */}
        {showRightPanel && (
          <div className="hidden md:flex flex-col justify-start items-stretch bg-transparent border-l border-gray-200 dark:border-neutral-800 min-w-[240px] max-w-[280px] h-full pl-0 ml-2">
            <SuggestedQueriesSidebar
              suggestedQueries={suggestedQueries}
              handleSuggestedQuery={handleSuggestedQuery}
            />
          </div>
        )}
      </div>
      {/* Suggested Queries (mobile, below chat area) */}
      {showRightPanel && (
        <div className="block md:hidden w-full px-2 pb-2">
          <SuggestedQueriesSidebar
            suggestedQueries={suggestedQueries}
            handleSuggestedQuery={handleSuggestedQuery}
          />
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
