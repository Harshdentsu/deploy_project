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
      { text: "Claim Status",value: "Show me my claim status", iconImage: "/claim.png" },
      { text: " SKU Availability",value:"stocks of urbanBias", iconImage: "/trend.png" },
      { text: "Similar Products ",value:"Show me the similar products to",iconImage: "/sku.png" },
      { text:" My Orders",value:"What are the orders placed by me this month",iconImage: "/box.png" }
    ],
    admin: [
      { text: "List all sales reps" },
      { text: "Show dealer performance" },
      { text: "Add a new SKU" }
    ],
    sales_rep: [
      { text: "Assigned Dealers",value:"Dealers assigned to me", iconImage: "/trend.png"},
      { text: "SKU Availability",value:"Show me stocks of ",iconImage: "/pin.png" },
      { text: " Place an Order",value:"Place an order of " ,iconImage: "/box.png" },
      { text: "Monthly Performance",value:"Show me monthly performance", iconImage: "/target.png"}
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
    <div className="h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-white flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          chats={chats}
          currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId}
          handleNewChat={() => {
            const newChatId = (Math.max(...chats.map(chat => parseInt(chat.id))) + 1).toString();
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
            setChats(prev => prev.filter(chat => chat.id !== chatId));
            if (currentChatId === chatId) {
              setCurrentChatId("1");
            }
          }}
          navigate={navigate}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Sidebar Panel */}
          <div className="relative z-50 w-64 bg-white dark:bg-gray-900 shadow-lg">
            <Sidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              chats={chats}
              currentChatId={currentChatId}
              setCurrentChatId={setCurrentChatId}
              handleNewChat={() => {
                const newChatId = (Math.max(...chats.map(chat => parseInt(chat.id))) + 1).toString();
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}


      <div className="flex-1 flex">
        <div className="w-full flex flex-col dark:bg-gray-900 dark:text-white relative transition-all duration-300">
          <AssistantHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            handleLogout={handleLogout}
            email={user.email}
            role={role}
            username={username}
          />
          <div className="flex-1 flex flex-col overflow-hidden relative dark:text-white">
            <ChatMessages
              messages={currentChat?.messages || []}
              isTyping={isTyping}
              animatingMessageId={undefined}
              animatedContent={""}
              messagesEndRef={messagesEndRef}
              onContextSelect={handleContextSelect}
            />
            {selectedContext && (
              <div className="max-w-4xl mx-auto mb-2">
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg flex items-center justify-between text-sm">
                  <span>Context: <span className="font-semibold">{selectedContext}</span></span>
                  <button
                    className="ml-4 text-xs text-orange-700 hover:underline"
                    onClick={() => setSelectedContext(null)}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            <div className="w-full pl-1 pr-2 sm:pl-4 sm:pr-10 md:pl-6 md:pr-16 mb-4">
              <div className="w-full max-w-4xl mx-auto ml-4 mr-3">
                <ChatInput
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                  handleSendMessage={handleSendMessage}
                  isTyping={isTyping}
                  inputRef={inputRef}
                />
              </div>
            </div>

          </div>
        </div>

        {showRightPanel && (
          <div className="hidden md:block">
            <SuggestedQueriesSidebar
              suggestedQueries={suggestedQueries}
              handleSuggestedQuery={handleSuggestedQuery}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAssistant;
