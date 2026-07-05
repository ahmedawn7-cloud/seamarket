import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { week_label, product_url, product_name } = await request.json();
    
    if (!week_label) return NextResponse.json({ duplicate: false });

    // Exact URL match
    if (product_url) {
      const { data: urlMatch } = await supabaseAdmin
        .from('product_intake')
        .select('id')
        .eq('week_label', week_label)
        .eq('product_url', product_url)
        .limit(1);
        
      if (urlMatch && urlMatch.length > 0) {
        return NextResponse.json({ duplicate: true, reason: 'Exact URL already exists this week.' });
      }
    }

    // Fuzzy name match (very basic ILIKE)
    if (product_name) {
      const { data: nameMatch } = await supabaseAdmin
        .from('product_intake')
        .select('id')
        .eq('week_label', week_label)
        .ilike('product_name', `%${product_name}%`)
        .limit(1);
        
      if (nameMatch && nameMatch.length > 0) {
        return NextResponse.json({ duplicate: true, reason: 'Similar product name exists this week.' });
      }
    }

    return NextResponse.json({ duplicate: false });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

