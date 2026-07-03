import OpsShell from "@/components/ops/OpsShell";

export const metadata = {
  title: "Operations Backend / Profit Pilot AI",
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <OpsShell>{children}</OpsShell>;
}
