export const starterPrompts = [
  "Is this product worth selling in Malaysia?",
  "What products should I avoid this week?",
  "How do I calculate Shopee profit margin?",
  "Do I need SIRIM, KKM, or NPRA approval?",
  "Find me low-risk products with local suppliers.",
  "Generate a TikTok Shop product title.",
];

export default function StarterPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="grid gap-2">
      {starterPrompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-left text-xs font-medium leading-5 text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:text-[var(--foreground)]"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
