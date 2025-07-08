import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AssistantHeader from "@/components/assistant/AssistantHeader";
import ChatInput from "@/components/assistant/ChatInput";
import ChatMessages from "@/components/assistant/ChatMessages";
import GreetingSection from "@/components/assistant/GreetingSection";
import SuggestedQueriesSidebar from "@/components/assistant/SuggestedQueriesSidebar";

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
  
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "New Thread",
      lastMessage: "",
      timestamp: new Date(),
      messages: []
    }
  ]);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const hasMessages = currentChat?.messages && currentChat.messages.length > 0;
  const showGreeting = !hasMessages && !inputFocused && !currentInput.trim();
  //currently added 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : {};
  console.log(user);
  const email = user.email || "";
  const role = user.role || localStorage.getItem("userRole") || "";
  const username=user.username;

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

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentInput,
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
    setCurrentInput(query);
    setInputFocused(true);
    setShowRightPanel(true);
    
    // Focus the input field after a short delay to ensure state is updated
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    
    console.log('State updated - currentInput should be:', query);
  };

  const suggestedQueries = [
    { text: "List all my claims", icon: "👤" },
    { text: "Give me specification of UrbanBias", icon: "📧" },
    { text: "Tell me about dealer ", icon: "📋" },
    { text: "Tell me salesRep assigned to me .", icon: "⚙️" }
  ];



  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 dark:text-white flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white dark:bg-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden shadow-sm`}>
        {/* Empty Sidebar - Just keeping the toggle functionality */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Sidebar</p>
          </div>
        </div>
      </div>

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
                />

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