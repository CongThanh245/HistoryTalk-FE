  const TypingText = ({ text, className = "" }: { text: string, className?: string }) => (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span key={index} className="char inline-block" style={{ opacity: 0, fontFamily: "var(--font-title)" }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );

  export default TypingText;