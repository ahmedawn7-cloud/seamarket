export function buildSource(provider: string, type: string, notes?: string) {
  return {
    provider,
    type,
    timestamp: new Date().toISOString(),
    notes: notes || "Rule-based inference from cleaned product data"
  };
}
