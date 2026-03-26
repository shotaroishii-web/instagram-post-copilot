"use client";

import { GeneratedOutput } from "@/lib/generate";
import CopyButton from "./CopyButton";

interface OutputSectionProps {
  output: GeneratedOutput;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs tracking-widest text-[#6B6B6B] uppercase mb-4">
      {children}
    </h3>
  );
}

function OutputItem({
  text,
  index,
}: {
  text: string;
  index: number;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#E0E0DC] last:border-b-0">
      <span className="text-xs text-[#BEBEBE] mt-0.5 w-4 shrink-0">{index + 1}</span>
      <p className="text-sm text-[#1A1A1A] leading-relaxed flex-1 whitespace-pre-line">{text}</p>
      <CopyButton text={text} />
    </div>
  );
}

export default function OutputSection({ output }: OutputSectionProps) {
  const fullText = [
    "【冒頭フック】",
    output.hooks[0],
    "",
    "【本文】",
    output.bodies[0],
    "",
    "【CTA】",
    output.ctas[0],
  ].join("\n");

  return (
    <div className="space-y-12 pt-2">
      {/* 全コピー */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E0E0DC]">
        <span className="text-xs text-[#6B6B6B]">生成結果</span>
        <CopyButton text={fullText} />
      </div>

      {/* 冒頭フック */}
      <section>
        <SectionLabel>冒頭フック — 5案</SectionLabel>
        <div>
          {output.hooks.map((hook, i) => (
            <OutputItem key={i} text={hook} index={i} />
          ))}
        </div>
      </section>

      {/* 本文 */}
      <section>
        <SectionLabel>本文 — 3案</SectionLabel>
        <div>
          {output.bodies.map((body, i) => (
            <OutputItem key={i} text={body} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section>
        <SectionLabel>CTA — 3案</SectionLabel>
        <div>
          {output.ctas.map((cta, i) => (
            <OutputItem key={i} text={cta} index={i} />
          ))}
        </div>
      </section>

      {/* ハッシュタグ方針 */}
      <section>
        <SectionLabel>ハッシュタグ方針</SectionLabel>
        <div className="flex items-start gap-3">
          <p className="text-sm text-[#1A1A1A] leading-relaxed flex-1 whitespace-pre-line">
            {output.hashtagPolicy}
          </p>
          <CopyButton text={output.hashtagPolicy} />
        </div>
      </section>

      {/* NGポイント */}
      <section>
        <SectionLabel>NGポイント</SectionLabel>
        <ul className="space-y-3">
          {output.ngPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="mt-1.5 w-1 h-1 rounded-full bg-[#C17A40] shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm text-[#6B6B6B] leading-relaxed">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
