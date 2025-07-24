import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  animatingMessageId: string | null;
  animatedContent: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onContextSelect?: (context: string) => void;
  username: string;
}

const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/[\s._-]+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
const ChatMessages = ({
  messages,
  isTyping,
  animatingMessageId,
  animatedContent,
  messagesEndRef,
  onContextSelect,
  username

}: ChatMessagesProps) => {
  // Scroll to bottom on new messages
  const userInitials = getInitials(username); // ✅ NOW inside the component
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleMouseUp = (msg: Message) => {
    if (msg.sender !== "assistant") return;
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText && selectedText.length > 1) {
      onContextSelect?.(selectedText);
    }
  };

  return (
    <ScrollArea className="flex-1 px-2 sm:px-4 md:px-6 py-4 md:pr-64">
  <div className="w-full max-w-3xl mx-auto space-y-6">
    {messages.map((message, index) => (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className={`flex ${
          message.sender === "user" ? "justify-end" : "justify-start"
        }`}
        onMouseUp={() => handleMouseUp(message)}
      >
        <div
          className={`flex space-x-3 sm:space-x-4 ${
            message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
          } w-full`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            {message.sender === "user" ? (
              <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
                <AvatarFallback className="bg-orange-400 text-white text-xs sm:text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                <AvatarImage
                  src="/logo3.png"
                  alt="AI Avatar"
                  className="object-contain"
                />
                <AvatarFallback className="bg-gray-300 dark:bg-gray-700 text-xs text-black dark:text-white">
                  AI
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-2xl p-3 sm:p-4 text-sm sm:text-base max-w-[85%] ${
              message.sender === "user"
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
            }`}
          >
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => (
                  <p className="leading-relaxed" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-5 mb-2" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-5 mb-2" {...props} />
                ),
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic" {...props} />
                ),
                code: ({ node, ...props }) => {
                  const rawText = Array.isArray(props.children)
                    ? props.children.join("")
                    : props.children?.toString() || "";

                  return (
                    <code
                      className="bg-gray-100 dark:bg-gray-700 px-1 rounded cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-700 transition"
                      onClick={() => onContextSelect?.(rawText)}
                      title="Click to use as context"
                    >
                      {props.children}
                    </code>
                  );
                },
              }}
            >
              {message.sender === "assistant" &&
              message.id === animatingMessageId
                ? animatedContent
                : message.content}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>
    ))}

    {/* Typing animation */}
    {isTyping && (
      <motion.div
        className="flex justify-start"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex space-x-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    )}

    <div ref={messagesEndRef} />
  </div>
</ScrollArea>

  );
};

export default ChatMessages;