import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useEffect } from "react";
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
}

const ChatMessages = ({
  messages,
  isTyping,
  animatingMessageId,
  animatedContent,
  messagesEndRef,
  onContextSelect,
}: ChatMessagesProps) => {
  // Scroll to bottom on new messages
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
    <ScrollArea className="flex-1 p-6 pr-72">
      <div className="max-w-4xl mx-auto space-y-6">
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
              className={`flex space-x-4 max-w-3xl ${
                message.sender === "user"
                  ? "flex-row-reverse space-x-reverse"
                  : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === "user"
                    ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
                    : "bg-gradient-to-br text-white"
                }`}
              >
                {message.sender === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <img
                    src="/logo3.png"
                    alt="Wheely Logo"
                    className="w-6 h-6 rounded-full"
                  />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`rounded-2xl p-4 ${
                  message.sender === "user"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "bg-white text-gray-900 dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700"
                }`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => (
                      <p className="text-sm leading-relaxed" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc pl-6 mb-2" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal pl-6 mb-2" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="mb-1" {...props} />
                    ),
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
                          className="bg-gray-100 px-1 rounded cursor-pointer hover:bg-orange-200 transition"
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
            <div className="flex space-x-4 max-w-3xl">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Scroll bottom ref */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;
