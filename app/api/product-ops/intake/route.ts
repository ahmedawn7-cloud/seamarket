import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekLabel = searchParams.get('week_label');
  
  try {
    let query = supabaseAdmin.from('product_intake').select('*').order('created_at', { ascending: false });
    if (weekLabel) query = query.eq('week_label', weekLabel);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('product_intake')
      .insert(body)
      .select('*')
      .single();

    if (error) throw error;
    
    // Log productivity
    if (data.agent_name) {
      await supabaseAdmin.from('agent_productivity_logs').insert({
        week_label: data.week_label,
        agent_name: data.agent_name,
        agent_email: data.agent_email,
        action: 'submit_product',
        product_intake_id: data.id,
        metadata: { platform: data.platform }
      });
      try {
        await supabaseAdmin.rpc('increment_submitted_count', { w_label: data.week_label });
      } catch (e) {
        // Ignoring RPC error if it doesn't exist yet
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const { data, error } = await supabaseAdmin
      .from('product_intake')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) throw new Error("Missing ID");

    const { error } = await supabaseAdmin
      .from('product_intake')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

