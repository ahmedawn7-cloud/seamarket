import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runAllBots } from '../../../../lib/product-ops/bots/runAllBots';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { week_label, product_intake_id } = await request.json();
    
    let products = [];
    
    if (product_intake_id) {
      const { data } = await supabaseAdmin.from('product_intake').select('*').eq('id', product_intake_id).single();
      if (data) products.push(data);
    } else if (week_label) {
      // Mark week as bots running
      await supabaseAdmin.from('product_research_weeks').update({ status: 'bots_running', bots_started_at: new Date().toISOString() }).eq('week_label', week_label);
      
      const { data } = await supabaseAdmin.from('product_intake').select('*').eq('week_label', week_label).eq('status', 'approved');
      if (data) products = data;
    }

    if (products.length === 0) {
      return NextResponse.json({ message: 'No products to run bots on.' });
    }

    // Trigger async bot execution (non-blocking for HTTP response)
    // In Vercel serverless, this might timeout if not handled via Inngest/Upstash/Queues,
    // but for MVP we return response and let it run (or map sequentially if running locally).
    
    // To ensure they complete before Vercel kills the lambda, we await them for this MVP.
    // If it's too long, it should be moved to a background job.
    console.log(`Starting runAllBots for ${products.length} products...`);
    
    for (const p of products) {
      await runAllBots(p);
    }

    if (week_label && !product_intake_id) {
      await supabaseAdmin.from('product_research_weeks').update({ 
        status: 'completed', 
        bots_completed_at: new Date().toISOString() 
      }).eq('week_label', week_label);
    }

    return NextResponse.json({ success: true, count: products.length });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

