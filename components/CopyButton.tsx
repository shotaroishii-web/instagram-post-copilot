"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-[#6B6B6B] hover:text-[#C17A40] transition-colors duration-150 px-2 py-1 rounded border border-[#E0E0DC] hover:border-[#C17A40] shrink-0"
      aria-label="コピー"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
