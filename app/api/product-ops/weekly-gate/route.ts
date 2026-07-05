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
    const { data: week } = await supabaseAdmin.from('product_research_weeks').select('*').eq('week_label', weekLabel).single();
    if (!week) return NextResponse.json({ error: 'week not found' }, { status: 404 });

    const { data: intake } = await supabaseAdmin.from('product_intake').select('status').eq('week_label', weekLabel);
    
    const approved = intake?.filter(i => i.status === 'approved').length || 0;
    const submitted = intake?.filter(i => i.status === 'submitted').length || 0;
    const needsFix = intake?.filter(i => i.status === 'needs_fix').length || 0;

    return NextResponse.json({
      week,
      summary: {
        total_intake: intake?.length || 0,
        approved,
        submitted,
        needs_fix: needsFix,
        is_target_reached: approved >= week.target_total
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { week_label, override_reason, admin_user } = await request.json();
    
    // 1. Lock the week
    await supabaseAdmin
      .from('product_research_weeks')
      .update({
        status: 'locked_for_bot_research',
        locked_at: new Date().toISOString(),
        locked_by: admin_user || 'admin',
        lock_reason: override_reason || 'Target reached'
      })
      .eq('week_label', week_label);

    // 2. Lock all intake products
    await supabaseAdmin
      .from('product_intake')
      .update({ locked: true })
      .eq('week_label', week_label);

    // The frontend will then call run-all-bots to trigger the background research, 
    // or we could trigger a background worker here if we had one.
    // For this MVP, we will rely on the client invoking the bot routes iteratively or via a batch endpoint.

    return NextResponse.json({ success: true, message: 'Week locked successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

