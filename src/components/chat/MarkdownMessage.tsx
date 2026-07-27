"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Props {
  text: string;
}

export function MarkdownMessage({ text }: Props) {
  const components: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => (
      <strong className="font-semibold text-accent-gold">
        {children}
      </strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1">{children}</ol>,
    li: ({ children }) => <li>{children}</li>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
        style={{ color: "var(--accent-gold)" }}
      >
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code
        className="px-1 py-0.5 rounded text-xs"
        style={{ background: "var(--bg-elevated)" }}
      >
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre
        className="p-2 rounded-lg overflow-x-auto text-xs mb-2 last:mb-0"
        style={{ background: "var(--bg-elevated)" }}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="pl-2 border-l-2 mb-2 last:mb-0"
        style={{ borderColor: "var(--accent-gold-soft)" }}
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
