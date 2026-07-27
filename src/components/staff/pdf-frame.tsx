"use client";

import * as React from "react";

interface PdfFrameProps {
  src: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a PDF via the browser's built-in viewer, but creates/destroys the
 * <iframe> imperatively instead of letting React own that DOM node.
 *
 * Chrome asynchronously rewrites an iframe's internal document once a PDF
 * finishes loading (its native PDF viewer takes over the frame). If React
 * later tries to unmount/replace that same node — a dialog closing, a `key`
 * change on file swap, etc. — the two mutate the DOM at the same time and
 * `removeChild` throws "the node to be removed is not a child of this node".
 * Keeping the iframe out of React's vdom (React only ever sees the empty
 * wrapper div) means only our own guarded cleanup below ever removes it.
 */
export function PdfFrame({ src, title, className, style }: PdfFrameProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = title;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    container.appendChild(iframe);

    return () => {
      if (iframe.parentNode === container) {
        container.removeChild(iframe);
      }
    };
  }, [src, title]);

  return <div ref={containerRef} className={className} style={style} />;
}
