import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { forwardRef } from "react";

interface ChatInputProps {
  currentInput: string;
  setCurrentInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const ChatInput = ({ 
  currentInput, 
  setCurrentInput, 
  handleSendMessage, 
  isTyping, 
  placeholder = "Ask Wheely a question or make a request...",
  className = "",
  onFocus,
  inputRef
}: ChatInputProps) => {
  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={currentInput}
        onChange={(e) => setCurrentInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        onFocus={onFocus}
        className="w-full h-14 pl-4 pr-20 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-300 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
        <Button
          onClick={handleSendMessage}
          disabled={!currentInput.trim() || isTyping}
          className="h-8 w-8 p-0 bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ChatInput;
