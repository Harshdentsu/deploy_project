
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SuggestedQuery } from "@/types/chat";
import { containerVariants, orbVariants } from "@/utils/animations";
import { easeInOut } from "framer-motion";
interface GreetingSectionProps {
  displayName: string;
  currentInput: string;
  setCurrentInput: (value: string) => void;
  onSendMessage: () => void;
  onSuggestedQuery: (query: string) => void;
  onInputFocus: () => void;
  isTyping: boolean;
  showRightPanel: boolean;
  suggestedQueries: SuggestedQuery[];
  inputRef?: React.RefObject<HTMLInputElement>;
}

const GreetingSection = ({ 
  displayName, 
  currentInput, 
  setCurrentInput, 
  onSendMessage, 
  onSuggestedQuery, 
  onInputFocus,
  isTyping,
  showRightPanel,
  suggestedQueries,
  inputRef
}: GreetingSectionProps) => {
  const [greetingText, setGreetingText] = useState('');
  const [showGreetingComplete, setShowGreetingComplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const fullText = `Good Afternoon, ${displayName}`;
      let currentIndex = 0;
      setGreetingText('');
      
      const typeTimer = setTimeout(() => {
        const typingInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            setGreetingText(fullText.slice(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(typingInterval);
            setShowGreetingComplete(true);
          }
        }, 50);
        
        return () => clearInterval(typingInterval);
      }, 800);
      
      return () => clearTimeout(typeTimer);
    }
  }, [mounted, displayName]);

  // Animation variants for smooth transitions
  const queryCardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 1.2 + (i * 0.1)
      }
    }),
    exit: {
      opacity: 0,
      x: 400,
      scale: 0.8,
      transition: {
        duration: 0.6,
        delay: 0,
        ease: easeInOut
      }
    }
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col items-center justify-center px-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Floating AI Orb with magical effects */}
      <motion.div 
        className="relative mb-8"
        variants={orbVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg"
          animate={{
            boxShadow: [
              "0 0 20px rgba(251, 146, 60, 0.3)",
              "0 0 40px rgba(251, 146, 60, 0.5)",
              "0 0 20px rgba(251, 146, 60, 0.3)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-10 w-10 text-white" />
          </motion.div>
        </motion.div>
        
        {/* Magical particles */}
        <motion.div 
          className="absolute -inset-4 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity
          }}
        />
      </motion.div>
      
      {/* Animated Greeting Text with typing effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mb-2"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white font-inter text-center min-h-[3rem] flex items-center">
          {greetingText}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="ml-1"
          >
            |
          </motion.span>
        </h1>
      </motion.div>
      
      <motion.p 
        className="text-xl text-gray-600 dark:text-gray-200 mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showGreetingComplete ? 1 : 0, y: showGreetingComplete ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        What's on <span className="text-orange-600 dark:text-orange-300">your mind?</span>
      </motion.p>

      {/* Centered Input */}
      <motion.div 
        className="w-full max-w-2xl mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: showGreetingComplete ? 1 : 0, y: showGreetingComplete ? 0 : 30 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder="Ask AI a question or make a request..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            onFocus={onInputFocus}
            className="w-full h-14 pl-4 pr-20 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-300 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <Button
              onClick={onSendMessage}
              disabled={!currentInput.trim() || isTyping}
              className="h-8 w-8 p-0 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Suggested Queries - Enhanced Animation */}
      <motion.div 
        className="w-full max-w-4xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: showGreetingComplete ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <motion.div 
          className="text-xs text-gray-500 dark:text-gray-300 text-center mb-4 uppercase tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showGreetingComplete ? 1 : 0, y: showGreetingComplete ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          Get started with an example below
        </motion.div>
        
        <AnimatePresence mode="wait">
          {!showRightPanel && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              {suggestedQueries.map((query, index) => (
                <motion.button
                  key={index}
                  custom={index}
                  variants={queryCardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => onSuggestedQuery(query.text)}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all text-left group transform hover:scale-105"
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-2xl mb-2 dark:text-white">{query.icon}</div>
                  <p className="text-sm text-gray-700 dark:text-white group-hover:text-gray-900 dark:group-hover:text-gray-100">{query.text}</p>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default GreetingSection;
