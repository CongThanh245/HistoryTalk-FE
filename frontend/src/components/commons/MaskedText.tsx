const MaskedText = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`overflow-hidden ${className}`}>
    <div className="reveal-text inline-block w-full">{children}</div>
  </div>
);

export default MaskedText;