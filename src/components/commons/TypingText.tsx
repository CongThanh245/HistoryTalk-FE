const TypingText = ({ text, className = "" }: { text: string, className?: string }) => (
  <span className={className}>
    {text.split('').map((char, index) => (
      <span key={index} className="char inline-block font-[family-name:var(--font-title)]">
        {char === ' ' ? ' ' : char}
      </span>
    ))}
  </span>
);

export default TypingText;
