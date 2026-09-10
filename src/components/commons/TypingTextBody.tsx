const TypingTextBody = ({ text, className = "" }: { text: string, className?: string }) => (
  <span className={className}>
    {text.split('').map((char, index) => (
      <span key={index} className="char inline-block font-body">
        {char === ' ' ? ' ' : char}
      </span>
    ))}
  </span>
);

export default TypingTextBody;
