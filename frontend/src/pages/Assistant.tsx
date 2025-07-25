import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import GreetingSection from "@/components/assistant/GreetingSection";
import React, { useState } from "react";

const Assistant = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const rawUsername = localStorage.getItem("username") || "User";
  const firstName = rawUsername.split(".")[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const [currentInput, setCurrentInput] = useState("");

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 dark:text-white flex flex-col sm:flex-row overflow-x-hidden">
      <GreetingSection
        displayName={displayName}
        currentInput={currentInput}
        setCurrentInput={setCurrentInput}
        onSendMessage={() => navigate('/chat-assistant')}
        isTyping={false}
        onSuggestedQuery={() => navigate('/chat-assistant')}
        suggestedQueries={[]}
        onInputFocus={() => navigate('/chat-assistant')}
        showRightPanel={false}
        inputRef={inputRef}
      />
    </div>
  );
};

export default Assistant;
