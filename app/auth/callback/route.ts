import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      const email = session.user.email?.toLowerCase();
      const ownerEmail = process.env.OPS_OWNER_EMAIL || "ahmedawn7@gmail.com";
      const plan = email === ownerEmail ? "pro" : "registered";
      const displayName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email?.split('@')[0] || "Scout";
      const avatarUrl = session.user.user_metadata?.avatar_url || null;

      // Ensure profile exists in user_profiles
      await supabase.from("user_profiles").upsert({
        id: session.user.id,
        display_name: displayName,
        business_type: "Seller",
        country: "Malaysia",
        plan: plan,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true });

      // Ensure profile exists in community_contributor_profiles
      await supabase.from("community_contributor_profiles").upsert({
        user_id: session.user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id', ignoreDuplicates: true });
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
