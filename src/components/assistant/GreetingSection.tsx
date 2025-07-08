import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Zap, Brain, Lightbulb, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SuggestedQuery } from "@/types/chat";
import { containerVariants, orbVariants } from "@/utils/animations";
import { easeInOut, easeOut, Easing } from "framer-motion";

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
      const hour = new Date().getHours();
      let timeGreeting = "";
  
      if (hour < 12) {
        timeGreeting = "Good Morning";
      } else if (hour >= 12 && hour < 18) {
        timeGreeting = "Good Afternoon";
      } else {
        timeGreeting = "Good Evening";
      }
  
      const fullText = `${timeGreeting}, ${displayName}`;
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
  

  // Enhanced animation variants for smooth, fluid transitions
  const queryCardVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.8,
      rotateX: -15,
      filter: "blur(4px)"
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: easeOut
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      rotateY: 2,
      transition: {
        duration: 0.3,
        ease: easeOut
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    },
    exit: {
      opacity: 0,
      x: 400,
      scale: 0.8,
      rotateX: -15,
      transition: {
        duration: 0.6,
        ease: easeInOut
      }
    }
  };

  // Enhanced container animation
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  // Floating particles animation
  const particleVariants = {
    animate: {
      y: [-10, 10, -10],
      x: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: easeInOut
      }
    }
  };

  // Background gradient animation
  const backgroundVariants = {
    animate: {
      background: [
        "linear-gradient(45deg, rgba(251, 146, 60, 0.1), rgba(168, 85, 247, 0.1))",
        "linear-gradient(45deg, rgba(168, 85, 247, 0.1), rgba(251, 146, 60, 0.1))",
        "linear-gradient(45deg, rgba(251, 146, 60, 0.1), rgba(168, 85, 247, 0.1))"
      ],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: easeInOut
      }
    }
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerAnimation}
    >
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0 "
        variants={backgroundVariants}
        animate="animate"
      />

      {/* Floating geometric shapes for visual interest */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 1 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-orange-400/30 to-purple-400/30 rounded-full"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${10 + (i * 20)}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </motion.div>

      {/* Floating AI Orb with enhanced magical effects */}
      <motion.div 
        className="relative mt-4 mb-6 sm:mt-6 sm:mb-8 md:mt-8 md:mb-10"
        variants={orbVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden"
          animate={{
            boxShadow: [
              "0 0 20px rgba(251, 146, 60, 0.4)",
              "0 0 40px rgba(251, 146, 60, 0.6)",
              "0 0 20px rgba(251, 146, 60, 0.4)"
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Inner glow effect */}
          <motion.div 
            className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white drop-shadow-lg" />
          </motion.div>
        </motion.div>
        
        {/* Enhanced magical particles */}
        <motion.div 
          className="absolute -inset-4 sm:-inset-5 md:-inset-6 bg-gradient-to-br from-orange-400/30 to-orange-600/30 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating particles around the orb */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full"
            style={{
              left: `${50 + 25 * Math.cos(i * 60 * Math.PI / 180)}%`,
              top: `${50 + 25 * Math.sin(i * 60 * Math.PI / 180)}%`,
            }}
            variants={particleVariants}
            animate="animate"
            transition={{
              delay: i * 0.5,
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
      
      {/* Enhanced Animated Greeting Text with typing effect */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        className="mb-3 sm:mb-4"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white font-inter text-center min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] lg:min-h-[4rem] flex items-center justify-center px-2">
          {greetingText}
        </h1>
      </motion.div>
      
      <motion.p 
        className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 md:mb-16 text-center max-w-lg sm:max-w-xl md:max-w-2xl leading-relaxed px-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: showGreetingComplete ? 1 : 0, y: showGreetingComplete ? 0 : 30 }}
        transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
      >
        What's on <span className="text-orange-600 dark:text-orange-400 font-semibold">your mind</span> today? I'm here to help you explore, create, and discover.
      </motion.p>

      {/* Enhanced Centered Input with glow effects */}
      <motion.div 
        className="w-full max-w-sm sm:max-w-lg md:max-w-2xl mb-8 sm:mb-10 md:mb-8 px-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: showGreetingComplete ? 1 : 0, y: showGreetingComplete ? 0 : 40 }}
        transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
      >
        <div className="relative group">
          {/* Animated glow background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            animate={{
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Floating particles around input */}
          <motion.div
            className="absolute -inset-2 bg-gradient-to-r from-orange-400/10 to-purple-400/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <Input
            ref={inputRef}
            placeholder="Ask AI a question or make a request..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            onFocus={onInputFocus}
            className="relative w-full h-12 sm:h-14 md:h-16 pl-4 sm:pl-6 pr-16 sm:pr-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl sm:rounded-2xl text-sm sm:text-base text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:shadow-2xl"
          />
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onSendMessage}
                disabled={!currentInput.trim() || isTyping}
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 p-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                
                  <Send className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Suggested Queries with fluid animations */}
      <motion.div 
        className="w-full max-w-4xl sm:max-w-5xl md:max-w-6xl px-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: showGreetingComplete ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 1.8 }}
      >
        <motion.div 
          className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mb-6 sm:mb-8 uppercase tracking-wider font-medium"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: showGreetingComplete ? 1 : 0, y: showGreetingComplete ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 2.0 }}
        >
          ✨ Get started with an example below
        </motion.div>
        
        <AnimatePresence mode="wait">
          {!showRightPanel && (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
              initial="hidden"
              animate="visible"
              exit={{
                opacity: 0,
                x: 400,
                transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1] }
              }}
            >
              {suggestedQueries.map((query, index) => (
                <div
                key={index}
                className="group relative p-4 sm:p-5 md:p-6 bg-white dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl text-left overflow-hidden transition-transform duration-300 ease-in-out"
                onClick={() => onSuggestedQuery(query.text)}
              >
                  <div className="text-2xl sm:text-2xl md:text-3xl mb-3 sm:mb-4 relative z-10">
                    {query.icon}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium leading-relaxed relative z-10 transition-colors duration-300">
                    {query.text}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default GreetingSection;
