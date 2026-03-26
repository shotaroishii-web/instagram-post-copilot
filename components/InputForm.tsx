"use client";

import { FormInput, PostPurpose } from "@/lib/generate";

interface InputFormProps {
  input: FormInput;
  onChange: (input: FormInput) => void;
}

const purposes: { value: PostPurpose; label: string; desc: string }[] = [
  { value: "save", label: "保存狙い", desc: "有益情報・まとめ系" },
  { value: "empathy", label: "共感狙い", desc: "感情・体験シェア系" },
  { value: "comment", label: "コメント狙い", desc: "問いかけ・議論系" },
  { value: "newbie", label: "新規向け", desc: "入門・発見系" },
];

const toneOptions = [
  "ですます調",
  "だ・である調",
  "話し言葉",
  "詩的・余白多め",
];

export default function InputForm({ input, onChange }: InputFormProps) {
  const set = <K extends keyof FormInput>(key: K, value: FormInput[K]) => {
    onChange({ ...input, [key]: value });
  };

  return (
    <div className="space-y-10">
      {/* 基本情報 */}
      <section className="space-y-6">
        <h2 className="text-xs tracking-widest text-[#6B6B6B] uppercase">
          基本情報
        </h2>

        <div className="space-y-2">
          <label className="block text-sm text-[#1A1A1A]">投稿テーマ</label>
          <input
            type="text"
            value={input.theme}
            onChange={(e) => set("theme", e.target.value)}
            placeholder="例: ミニマリスト的な部屋づくり"
            className="w-full bg-transparent border-b border-[#E0E0DC] py-2 text-sm text-[#1A1A1A] placeholder:text-[#BEBEBE] focus:outline-none focus:border-[#C17A40] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-[#1A1A1A]">伝えたい内容</label>
          <textarea
            value={input.content}
            onChange={(e) => set("content", e.target.value)}
            placeholder="例: 物を減らすことで、掃除の時間が週5分になった体験"
            rows={3}
            className="w-full bg-transparent border-b border-[#E0E0DC] py-2 text-sm text-[#1A1A1A] placeholder:text-[#BEBEBE] focus:outline-none focus:border-[#C17A40] transition-colors resize-none"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-[#1A1A1A]">投稿目的</label>
          <div className="grid grid-cols-2 gap-2">
            {purposes.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set("purpose", p.value)}
                className={`text-left px-4 py-3 border transition-colors duration-150 ${
                  input.purpose === p.value
                    ? "border-[#C17A40] bg-[#F9F2EA]"
                    : "border-[#E0E0DC] hover:border-[#C17A40]/40"
                }`}
              >
                <div className="text-sm text-[#1A1A1A]">{p.label}</div>
                <div className="text-xs text-[#6B6B6B] mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 世界観設定 */}
      <section className="space-y-6">
        <h2 className="text-xs tracking-widest text-[#6B6B6B] uppercase">
          世界観設定
        </h2>

        <div className="space-y-2">
          <label className="block text-sm text-[#1A1A1A]">よく使う言葉</label>
          <input
            type="text"
            value={input.frequentWords}
            onChange={(e) => set("frequentWords", e.target.value)}
            placeholder="例: 余白、静けさ、本質（カンマ区切り）"
            className="w-full bg-transparent border-b border-[#E0E0DC] py-2 text-sm text-[#1A1A1A] placeholder:text-[#BEBEBE] focus:outline-none focus:border-[#C17A40] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-[#1A1A1A]">避けたい言葉</label>
          <input
            type="text"
            value={input.avoidWords}
            onChange={(e) => set("avoidWords", e.target.value)}
            placeholder="例: バズる、映える、コスパ（カンマ区切り）"
            className="w-full bg-transparent border-b border-[#E0E0DC] py-2 text-sm text-[#1A1A1A] placeholder:text-[#BEBEBE] focus:outline-none focus:border-[#C17A40] transition-colors"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-[#1A1A1A]">口調</label>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("tone", t)}
                className={`px-3 py-1.5 text-sm border transition-colors duration-150 ${
                  input.tone === t
                    ? "border-[#C17A40] text-[#C17A40]"
                    : "border-[#E0E0DC] text-[#6B6B6B] hover:border-[#C17A40]/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-[#1A1A1A]">絵文字を使う</label>
          <button
            type="button"
            onClick={() => set("useEmoji", !input.useEmoji)}
            className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
              input.useEmoji ? "bg-[#C17A40]" : "bg-[#E0E0DC]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                input.useEmoji ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
