import { NextResponse } from 'next/server';
import { getNotifications } from '../../../../../lib/notifications';

export async function GET() {
  try {
    // Return pending notifications without clearing them
    const newNotifications = getNotifications();
    
    return NextResponse.json({ 
      success: true, 
      newNotifications 
    });
  } catch (error) {
    console.error('Error checking notifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to check notifications' }, { status: 500 });
  }
}
