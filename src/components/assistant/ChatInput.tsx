import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { forwardRef, useRef, useState } from "react";

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
  inputRef,
}: ChatInputProps) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentInput(transcript);
        setListening(false);
      };
      recognitionRef.current.onerror = () => setListening(false);
      recognitionRef.current.onend = () => setListening(false);
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setListening(true);
      recognitionRef.current.start();
    }
  };

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
        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        onFocus={onFocus}
        className="w-full h-14 pl-4 pr-20 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-300 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
        <Button
          type="button"
          onClick={handleVoiceInput}
          className={`h-10 w-10 p-0 rounded-full transition-all duration-200 mr-1 border-2 ${
            listening
              ? "bg-purple-500 text-white border-purple-700 scale-110"
              : "bg-white text-black border-gray-300"
          }`}
          title={listening ? "Listening..." : "Speak your query"}
          disabled={isTyping}
        >
          {listening ? "🎤" : "🎙️"}
        </Button>
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
