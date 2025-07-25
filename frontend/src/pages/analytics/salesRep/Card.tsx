import React from "react";

export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-2 ${className}`}>
      {children}
    </div>
  );
} 