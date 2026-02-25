export interface HowItWorksStep {
  emoji: string;
  title: string;
  description: string;
}

export function ToolHowItWorks({ steps }: { steps: HowItWorksStep[] }) {
  return (
    <section className="mt-16">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl">
        How It <span className="gradient-text">Works</span>
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-4xl">
              {step.emoji}
            </div>
            <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
