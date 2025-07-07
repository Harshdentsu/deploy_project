import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

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
}

function formatAsBullets(text: string): string {
  // If already contains Markdown bullets or numbers, return as is
  if (/^\\s*[-*•0-9.]/m.test(text)) return text;

  // Otherwise, split into sentences and add bullets
  // (You can use a more robust sentence splitter if needed)
  const sentences = text.split(/(?<=[.!?])\\s+/);
  return sentences
    .filter(Boolean)
    .map(sentence => `- ${sentence.trim()}`)
    .join('\n');
}

const ChatMessages = ({
  messages,
  isTyping,
  animatingMessageId,
  animatedContent,
  messagesEndRef,
}: ChatMessagesProps) => {
  return (
    <ScrollArea className="flex-1 p-6">
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
          >
            <div
              className={`flex space-x-4 max-w-3xl ${
                message.sender === "user"
                  ? "flex-row-reverse space-x-reverse"
                  : ""
              }`}
            >
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
                    src="/logo.png"
                    alt="Wheely Logo"
                    className="w-6 h-6 rounded-full"
                  />
                )}
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  message.sender === "user"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "bg-white text-gray-900 dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700"
                }`}
              >
                {message.sender === "assistant" &&
                message.id === animatingMessageId ? (
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
                      code: ({ node, ...props }) => (
                        <code className="bg-gray-100 px-1 rounded" {...props} />
                      ),
                    }}
                  >
                    {animatedContent}
                  </ReactMarkdown>
                ) : message.sender === "assistant" ? (
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
                      code: ({ node, ...props }) => (
                        <code className="bg-gray-100 px-1 rounded" {...props} />
                      ),
                    }}
                  >
                    {formatAsBullets(message.content)}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm leading-relaxed dark:text-white">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex space-x-4 max-w-3xl">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100">
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

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;
