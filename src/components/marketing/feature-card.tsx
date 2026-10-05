interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  variant?: 'default' | 'highlighted';
}

export function FeatureCard({ 
  icon, 
  title, 
  description,
  variant = 'default' 
}: FeatureCardProps) {
  return (
    <div
      className={`
        bg-[var(--bg-surface)]
        border rounded-[2px]
        p-8
        transition-colors duration-200
        group
        ${variant === 'highlighted'
          ? 'border-[var(--accent-gold)] border-t-[3px]'
          : 'border-[var(--text-primary)] hover:bg-[var(--text-primary)]'
        }
      `}
    >
      {/* Icon */}
      <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className={`archive-title is-plain text-[21px] ${variant === 'highlighted' ? '' : 'group-hover:text-[var(--text-inverse)]'}`}>
          {title}
        </h3>
        <p className={`text-[var(--text-secondary)] leading-relaxed ${variant === 'highlighted' ? '' : 'group-hover:text-[var(--text-inverse)] group-hover:opacity-80'}`}>
          {description}
        </p>
      </div>
    </div>
  );
}