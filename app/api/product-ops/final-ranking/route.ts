import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekLabel = searchParams.get('week_label');
  
  if (!weekLabel) return NextResponse.json({ error: 'week_label required' }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin
      .from('product_bot_research')
      .select('*, product_intake(*)')
      .eq('week_label', weekLabel)
      .order('final_opportunity_score', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

