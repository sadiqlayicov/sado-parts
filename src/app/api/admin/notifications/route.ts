import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { addNotification, getNotifications, clearNotifications } from '../../../../lib/notifications';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { type, message, data } = await request.json();
    
    addNotification(type, message, data);

    return NextResponse.json({ success: true, message: 'Notification created' });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return pending notifications
    const notifications = getNotifications();
    
    // Clear pending notifications after returning them
    clearNotifications();

    return NextResponse.json({ 
      success: true, 
      notifications 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
