import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const now = new Date();
  
  return NextResponse.json({
    success: true,
    message: '1C Upload Status',
    timestamp: now.toISOString(),
    status: {
      hasUploadedContent: !!global.uploadedFileContent,
      contentLength: global.uploadedFileContent ? global.uploadedFileContent.length : 0,
      lastActivity: global.lastActivityTime || 'No activity yet',
      uploadProgress: global.uploadProgress || 'Waiting for 1C...'
    },
    recentLogs: global.recentLogs || []
  });
}

// Initialize global variables if they don't exist
if (!global.lastActivityTime) {
  global.lastActivityTime = null;
}
if (!global.uploadProgress) {
  global.uploadProgress = 'Waiting for 1C...';
}
if (!global.recentLogs) {
  global.recentLogs = [];
}
