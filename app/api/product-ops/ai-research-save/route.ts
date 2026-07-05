import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_intake_id, ...aiResearchData } = body;

    if (!product_intake_id) {
      return NextResponse.json({ error: "Missing product_intake_id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('product_ai_research')
      .upsert({
        product_intake_id,
        ...aiResearchData,
        research_status: 'approved',
        is_approved: true
      }, { onConflict: 'product_intake_id' })
      .select('*')
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

