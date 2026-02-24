import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { getServiceSupabase } from '@/lib/supabase';

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
    try {
        const { title, body } = await req.json();

        const supabase = getServiceSupabase();

        // Get all subscriptions
        const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('*');

        if (error) {
            throw error;
        }

        const payload = JSON.stringify({
            title: title || '알림',
            body: body || '새로운 알림이 도착했습니다.'
        });

        // Send push to all subscribers
        const sendPromises = subscriptions.map(async (subRecord: any) => {
            try {
                await webpush.sendNotification(subRecord.subscription, payload);
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription has expired or is no longer valid
                    await supabase.from('push_subscriptions').delete().eq('id', subRecord.id);
                } else {
                    console.error('Error sending push:', err);
                }
            }
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, count: subscriptions.length });
    } catch (error) {
        console.error('Notify endpoint error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
