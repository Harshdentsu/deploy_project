import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

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
  placeholder = "Ask Wheely a question...",
  className = "",
  onFocus,
  inputRef,
}: ChatInputProps) => {
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice input.");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const lastResult = event.results[event.resultIndex];
        if (lastResult.isFinal) {
          setCurrentInput(lastResult[0].transcript);
          setInterimTranscript("");
        } else {
          setInterimTranscript(lastResult[0].transcript);
        }
      };

      recognitionRef.current.onerror = () => {
        setListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current.onend = () => {
        setListening(false);
        setInterimTranscript("");
      };
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setListening(true);
      setInterimTranscript("");
      recognitionRef.current.start();
    }
  };

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={interimTranscript || currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          onFocus={onFocus}
          className="h-14 w-full pl-4 pr-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
        />

        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center space-x-2">
        <Button
  type="button"
  onClick={handleVoiceInput}
  className={`h-10 w-10 p-0 rounded-full border transition-all duration-200 relative overflow-hidden
    ${
      listening
        ? "bg-orange-600 text-white border-orange-700 shadow-[0_0_0_3px_rgba(168,85,247,0.4)] hover:bg-orange-700"
        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
    }
  `}
  title={listening ? "Stop voice input" : "Start voice input"}
  disabled={isTyping}
>
  {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
</Button>


          <Button
            onClick={handleSendMessage}
            disabled={!currentInput.trim() || isTyping}
            className="h-10 w-10 p-0 bg-orange-600 text-white rounded-full hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Waveform simulation (only when listening) */}
        <AnimatePresence>
          {listening && (
            <motion.div
              className="absolute bottom-full mb-1 w-full text-center text-sm text-orange-500"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              Listening...
              <motion.div
                className="mx-auto mt-1 w-20 h-1 rounded-full bg-orange-500 animate-pulse"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ChatInput;
