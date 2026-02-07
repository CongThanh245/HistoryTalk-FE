export function SectionHeading({ title, subtitle }: Props) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold">{title}</h2>
      {subtitle && <p className="text-xl mt-4">{subtitle}</p>}
    </div>
  );
}