import Dashboard from "@/components/Dashboard";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let products: any[] = [];

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from("MYProductScout_Master")
      .select("*")
      .order("Rank", { ascending: true, nullsFirst: false })
      .limit(100);

    if (error) {
      console.error("Supabase products fetch failed:", error.message);
    }

    products = data ?? [];
  } else {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return <Dashboard initialProducts={products} />;
}