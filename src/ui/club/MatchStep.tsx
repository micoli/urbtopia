interface MatchStepProps {
  number: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}

export function MatchStep({ number, title, hint, children }: MatchStepProps) {
  return (
    <section className="club-step">
      <h4 className="club-step__title"><span className="club-step__number">{number}</span>{title}</h4>
      {hint && <p className="note note--muted">{hint}</p>}
      {children}
    </section>
  );
}
