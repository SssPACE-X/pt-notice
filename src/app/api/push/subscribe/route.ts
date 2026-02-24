import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const subscription = await req.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
        }

        const supabase = getServiceSupabase();

        // Store subscription in DB safely using service role key
        const { error } = await supabase.from('push_subscriptions').insert([{
            subscription: subscription
        }]);

        if (error) {
            console.error('Error saving subscription:', error);
            return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subscribe endpoint error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
