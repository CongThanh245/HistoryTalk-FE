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
        border rounded-[var(--radius-lg)] 
        p-8
        hover:bg-[var(--bg-elevated)]
        transition-all duration-300
        group
        ${variant === 'highlighted' 
          ? 'border-[var(--accent-gold)]' 
          : 'border-[var(--border-default)] hover:border-[var(--accent-gold)]/30'
        }
      `}
    >
      {/* Icon */}
      <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}