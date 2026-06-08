const TypingTextBody = ({ text, className = "" }: { text: string, className?: string }) => (
  <span className={className}>
    {text.split('').map((char, index) => (
      <span key={index} className="char inline-block" style={{ fontFamily: "var(--font-body)" }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))}
  </span>
);

export default TypingTextBody;
