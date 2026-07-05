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
    const { data: logs, error } = await supabaseAdmin
      .from('agent_productivity_logs')
      .select('*')
      .eq('week_label', weekLabel)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Group by agent
    const performance: Record<string, any> = {};
    for (const log of logs) {
      if (!performance[log.agent_name]) {
        performance[log.agent_name] = { submitted: 0, actions: 0 };
      }
      performance[log.agent_name].actions++;
      if (log.action === 'submit_product') {
        performance[log.agent_name].submitted++;
      }
    }

    return NextResponse.json(performance);
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

