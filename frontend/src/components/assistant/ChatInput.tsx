import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Send, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  currentInput: string;
  setCurrentInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
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
  const [inputHeight, setInputHeight] = useState(48);

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
        className="flex items-center gap-2 px-3 sm:px-6 py-3 w-full bg-white dark:bg-black rounded-2xl border border-gray-300 dark:border-neutral-900 shadow-lg focus-within:shadow-xl transition-all duration-200"
      >
        <div className="flex-1 flex items-end">
          <textarea
            ref={inputRef}
            placeholder={placeholder}
            value={interimTranscript || currentInput}
            onChange={(e) => {
              setCurrentInput(e.target.value);
              // Auto expand/shrink textarea
              const ta = e.target;
              ta.style.height = "48px";
              ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
              setInputHeight(Math.min(ta.scrollHeight, 180));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            onFocus={onFocus}
            className="w-full min-w-0 resize-none bg-transparent border-none focus:ring-0 focus:outline-none focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base sm:text-lg py-2 overflow-y-auto"
            style={{ minHeight: "48px", maxHeight: "180px", height: inputHeight + "px" }}
          />
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          {/* Voice input button */}
          <Button
            type="button"
            onClick={handleVoiceInput}
            className={`h-11 w-11 p-0 rounded-full border transition-all duration-200 relative overflow-hidden
              ${listening
                ? "bg-orange-600 text-white border-orange-700 shadow-[0_0_0_3px_rgba(168,85,247,0.4)] hover:bg-orange-700"
                : "bg-gray-100 dark:bg-neutral-900 text-gray-800 dark:text-slate-100 border-gray-300 dark:border-neutral-900 hover:bg-gray-200 dark:hover:bg-neutral-800"
              }`}
            title={listening ? "Stop voice input" : "Start voice input"}
            disabled={isTyping}
          >
            {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!currentInput.trim() || isTyping}
            className="h-11 w-11 p-0 bg-gradient-to-br from-orange-500 to-purple-600 text-white rounded-full shadow-lg hover:scale-110 hover:from-purple-600 hover:to-orange-500 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white dark:border-black"
            aria-label="Send message"
          >
            <Send className="h-6 w-6" />
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
