"use client";

import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { highlightKeywords } from "@/features/chat/useKeywordHighlight";
import type { KeywordData } from "@/data/keywords";

interface Props {
  text: string;
  onKeywordSelect?: (kw: KeywordData) => void;
}

// Áp highlight từ khóa lên các text node con trực tiếp (bỏ qua node đã là element,
// vd <em> lồng trong <strong> — trường hợp hiếm gặp trong output của AI).
function withKeywordHighlight(
  children: React.ReactNode,
  onSelect?: (kw: KeywordData) => void,
): React.ReactNode {
  if (!onSelect) return children;
  return React.Children.map(children, (child) =>
    typeof child === "string" ? highlightKeywords(child, onSelect) : child,
  );
}

export function MarkdownMessage({ text, onKeywordSelect }: Props) {
  const components: Components = {
    p: ({ children }) => (
      <p className="mb-2 last:mb-0">{withKeywordHighlight(children, onKeywordSelect)}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-accent-gold">
        {withKeywordHighlight(children, onKeywordSelect)}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic">{withKeywordHighlight(children, onKeywordSelect)}</em>
    ),
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1">{children}</ol>,
    li: ({ children }) => <li>{withKeywordHighlight(children, onKeywordSelect)}</li>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-accent-gold"
      >
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code
        className="px-1 py-0.5 rounded text-xs bg-bg-elevated"
      >
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre
        className="p-2 rounded-lg overflow-x-auto text-xs mb-2 last:mb-0 bg-bg-elevated"
      >
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="pl-2 border-l-2 border-accent-gold-soft mb-2 last:mb-0"
      >
        {children}
      </blockquote>
    ),
    h1: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
    h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
    h3: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
    h4: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
    h5: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
    h6: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
      {text}
    </ReactMarkdown>
  );
}
