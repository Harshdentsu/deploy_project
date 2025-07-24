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
      <div
        className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-2 sm:px-4 py-2 w-full bg-white dark:bg-black rounded-full border border-gray-300 dark:border-neutral-900"
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={interimTranscript || currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          onFocus={onFocus}
          className="flex-1 min-w-[150px] sm:min-w-[250px] bg-transparent border-none focus:ring-0 focus:outline-none focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleVoiceInput}
            className={`h-9 w-9 xs:h-10 xs:w-10 p-0 rounded-full border transition-all duration-200 relative overflow-hidden
              ${listening
                ? "bg-orange-600 text-white border-orange-700 shadow-[0_0_0_3px_rgba(168,85,247,0.4)] hover:bg-orange-700"
                : "bg-gray-100 dark:bg-neutral-900 text-gray-800 dark:text-slate-100 border-gray-300 dark:border-neutral-900 hover:bg-gray-200 dark:hover:bg-neutral-800"
              }`}
            title={listening ? "Stop voice input" : "Start voice input"}
            disabled={isTyping}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!currentInput.trim() || isTyping}
            className="h-9 w-9 xs:h-10 xs:w-10 p-0 bg-orange-600 text-white rounded-full hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {listening && (
          <motion.div
            className="text-sm text-orange-600 dark:text-orange-400 text-center mt-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            Listening...
            <motion.div className="mx-auto mt-1 w-20 h-1 rounded-full bg-orange-500 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatInput;
