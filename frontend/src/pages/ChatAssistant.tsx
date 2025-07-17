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

  // --- Role-based suggested queries logic (moved from Assistant.tsx) ---
  const roleBasedQueries = {
    dealer: [
      { text: "Show me status of my claims" },
      { text: "Show me SKU Availability" },
      { text: "Show me similar products to" },
      { text: "Show me orders placed for me" }
    ],
    admin: [
      { text: "List all sales reps" },
      { text: "Show dealer performance" },
      { text: "Add a new SKU" }
    ],
    sales_rep: [
      { text: " Show me SKU Availability" },
      { text: "Show me dealer performance" },
      { text: " Place an order" },
      { text: " Show me regional sales" }
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
      const response = await fetch("http://127.0.0.1:8000/api/query", {
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
        // Move cursor to the end
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
    <div className="h-screen bg-gradient-to-br from-orange-500 via-orange-300 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-white flex overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        chats={chats}
        currentChatId={currentChatId}
        setCurrentChatId={(id: string) => {
          setCurrentChatId(id);
        }}
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
      <div className="flex-1 flex">
        <div className="w-full flex flex-col bg-white dark:bg-gray-900 dark:text-white relative transition-all duration-300">
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
            <div className="w-full px-4 sm:px-8 mb-8">
              <div className="w-full max-w-2xl mx-auto">
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
          <SuggestedQueriesSidebar
            suggestedQueries={suggestedQueries}
            handleSuggestedQuery={handleSuggestedQuery}
          />
        )}
      </div>
    </div>
  );
};

export default ChatAssistant; 