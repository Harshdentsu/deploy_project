import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AssistantHeader from "@/components/assistant/AssistantHeader";
import ChatInput from "@/components/assistant/ChatInput";
import ChatMessages from "@/components/assistant/ChatMessages";
import GreetingSection from "@/components/assistant/GreetingSection";
import SuggestedQueriesSidebar from "@/components/assistant/SuggestedQueriesSidebar";
import Sidebar from "@/components/assistant/Sidebar"; // Add your custom image here

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

const Assistant = () => {
  // tracks if first prompt sent
  const [showRightPanel, setShowRightPanel] = useState(false);

  const [animatedContent, setAnimatedContent] = useState('');
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  // --- Add state for selected context ---
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const rawUsername = localStorage.getItem("username") || "User";
  const firstName = rawUsername.split(".")[0];
  const lastName = rawUsername.split(".")[1];
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const initials = (firstName[0] || "").toUpperCase() + (lastName[0] || "").toUpperCase(); 
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState("1");
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showSuggestedQueries, setShowSuggestedQueries] = useState(false);
  const [showGreetingOnce, setShowGreetingOnce] = useState(true);
  
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
  // Only show greeting if showGreetingOnce is true and the other greeting conditions are met
  const showGreeting = showGreetingOnce && !hasMessages && !inputFocused && !currentInput.trim();
  //currently added 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : {};
  console.log(user);
  const email = user.email || "";
  const role = user.role || localStorage.getItem("userRole") || "";
  const username=user.username;

  const roleBasedQueries = {
    dealer: [
      { text: "📋 Show me status of my claims" },
      { text: "📦 Show me SKU Availability" },
      { text: "🔍 Show me similar products to" },
      { text: "🧾 Show me orders placed for me" }
    ],
    admin: [
      { text: "List all sales reps", icon: "📋" },
      { text: "Show dealer performance", icon: "📊" },
      { text: "Add a new SKU", icon: "➕" }
    ],
    sales_rep: [
   { text: "📦 Show me SKU Availability" },          // Box emoji for stock/products
   { text: "📊 Show me dealer performance" },        // Bar chart for performance stats
   { text: "🛒 Place an order" },                    // Shopping cart for ordering
   { text: "🌍 Show me regional sales" }   
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

  // Debug effect to monitor currentInput changes
  useEffect(() => {
    console.log('currentInput changed to:', currentInput);
  }, [currentInput]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [animatingMessageId, animatedContent]);

  function animateMarkdownMessage(fullText: string, messageId: string) {
    setAnimatedContent('');
    setAnimatingMessageId(messageId);

    let i = 0;
    const chunkSize = 4; // Reveal 4 characters at a time for fluidity
    const interval = setInterval(() => {
      setAnimatedContent(fullText.slice(0, i + chunkSize));
      i += chunkSize;
      if (i >= fullText.length) {
        clearInterval(interval);
        setAnimatingMessageId(null);
        setAnimatedContent(''); // Reset after animation is done
      }
    }, 16); // 16ms for ~60fps, tweak for speed
  }

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    // --- Prepend context if present ---
    const inputWithContext = selectedContext
      ? `Context: ${selectedContext}\nQuery: ${currentInput}`
      : currentInput;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputWithContext,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ));

    setCurrentInput("");
    setInputFocused(false);
    setIsTyping(true);
    setShowSuggestedQueries(true);
    // --- Clear context after sending ---
    setSelectedContext(null);
    setShowGreetingOnce(false);

    try {
      const username = localStorage.getItem("username");
      // Send question to backend
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
      animateMarkdownMessage(assistantMessage.content, assistantMessage.id);
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
    console.log('Suggested query clicked:', query);
  
    // Strip emoji (anything at the start followed by a space)
    const cleanedQuery = query.replace(/^[^\w\s]*\s*/, '');
  
    setCurrentInput(cleanedQuery); // Use the cleaned query here
    setInputFocused(true);
    setShowRightPanel(true);
  
    // Focus the input field after a short delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  
    console.log('State updated - currentInput should be:', cleanedQuery);
  };
  

  // --- Add handler for context selection ---
  const handleContextSelect = (context: string) => {
    setSelectedContext(context);
    setInputFocused(true);
    setShowRightPanel(true);
    // Optionally, focus input
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 dark:text-white flex overflow-hidden">
      {/* Sidebar: Only show when not greeting */}
      {!showGreeting && (
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          chats={chats}
          currentChatId={currentChatId}
          setCurrentChatId={(id: string) => {
            setShowGreetingOnce(false);
            setCurrentChatId(id);
          }}
          handleNewChat={() => {
            setShowGreetingOnce(false);
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
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className={`${showSuggestedQueries ? 'flex-1' : 'w-full'} flex flex-col bg-white dark:bg-gray-900 dark:text-white relative transition-all duration-300`}>
          {/* Header */}
          <AssistantHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            handleLogout={handleLogout}
            initials={initials}
            email={email}
            role={role}
            username={username}
          />

          {/* Chat Content */}
          <div className="flex-1 flex flex-col overflow-hidden relative dark:text-white">
            {/* Greeting Section - Centered */}
            {showGreeting && (
              <GreetingSection
                displayName={displayName}
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                onSuggestedQuery={handleSuggestedQuery}
                suggestedQueries={suggestedQueries}
                onInputFocus={() => {
                  setInputFocused(true);
                  setShowRightPanel(true);
                }}
                showRightPanel={showRightPanel}
                inputRef={inputRef}
              />
            )}

            {/* Chat Messages */}
            {(hasMessages || (!showGreeting && (inputFocused || currentInput.trim()))) && (
              <>
                <ChatMessages
                  messages={currentChat?.messages || []}
                  isTyping={isTyping}
                  animatingMessageId={animatingMessageId}
                  animatedContent={animatedContent}
                  messagesEndRef={messagesEndRef}
                  // --- Pass context select handler ---
                  onContextSelect={handleContextSelect}
                />

                {/* Show selected context above input */}
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

                {/* Sticky Input at bottom */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900 dark:text-white">
                  <div className="max-w-4xl mx-auto">
                    <ChatInput
                      currentInput={currentInput}
                      setCurrentInput={setCurrentInput}
                      handleSendMessage={handleSendMessage}
                      isTyping={isTyping}
                      inputRef={inputRef}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Suggested Queries */}
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

export default Assistant; 
