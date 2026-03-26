"use client";

import { useState } from "react";
import InputForm from "@/components/InputForm";
import OutputSection from "@/components/OutputSection";
import { FormInput, GeneratedOutput, generateOutput } from "@/lib/generate";

const defaultInput: FormInput = {
  theme: "",
  content: "",
  purpose: "save",
  frequentWords: "",
  avoidWords: "",
  tone: "ですます調",
  useEmoji: false,
};

export default function Home() {
  const [input, setInput] = useState<FormInput>(defaultInput);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!input.theme.trim() && !input.content.trim()) return;
    setLoading(true);
    // ダミーロジック: 後でAPIに差し替え可能
    setTimeout(() => {
      setOutput(generateOutput(input));
      setLoading(false);
    }, 600);
  };

  const handleReset = () => {
    setOutput(null);
    setInput(defaultInput);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b border-[#E0E0DC]">
        <div className="max-w-[760px] mx-auto px-6 py-5 flex items-baseline justify-between">
          <div>
            <span className="text-base font-medium tracking-tight text-[#1A1A1A]">
              Caption Copilot
            </span>
            <span className="ml-3 text-xs text-[#6B6B6B]">
              Instagram フィード投稿向け
            </span>
          </div>
          {output && (
            <button
              onClick={handleReset}
              className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              ← 最初から
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-6 py-12 space-y-16">
        {!output ? (
          <>
            {/* Intro */}
            <div className="space-y-2">
              <h1 className="text-2xl font-light tracking-tight text-[#1A1A1A]">
                投稿の素材を入力してください。
              </h1>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                テーマと目的を設定すると、フック・本文・CTAを生成します。
              </p>
            </div>

            <InputForm input={input} onChange={setInput} />

            {/* Generate Button */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={loading || (!input.theme.trim() && !input.content.trim())}
                className="w-full py-4 text-sm tracking-wide border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAFAF8] transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "生成中..." : "キャプションを生成する"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Summary */}
            <div className="space-y-1">
              <p className="text-xs text-[#6B6B6B] tracking-widest uppercase">
                生成完了
              </p>
              <h1 className="text-xl font-light text-[#1A1A1A]">
                {input.theme || "（テーマ未設定）"}
              </h1>
              <p className="text-sm text-[#6B6B6B]">
                {["save", "empathy", "comment", "newbie"].includes(input.purpose) &&
                  {
                    save: "保存狙い",
                    empathy: "共感狙い",
                    comment: "コメント狙い",
                    newbie: "新規向け",
                  }[input.purpose]}
                {input.tone && ` · ${input.tone}`}
                {input.useEmoji ? " · 絵文字あり" : " · 絵文字なし"}
              </p>
            </div>

            <OutputSection output={output} />

            {/* Re-generate */}
            <div className="pt-4 pb-16">
              <button
                onClick={handleReset}
                className="w-full py-4 text-sm border border-[#E0E0DC] text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors duration-200"
              >
                もう一度生成する
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
