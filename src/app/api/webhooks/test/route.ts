import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;

    console.log('📱 Webhook test received:', { from, body });

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received',
      from,
      body 
    });
  } catch (error) {
    console.error('❌ Error in test webhook:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}