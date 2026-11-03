import { NextResponse } from 'next/server';
const { createOrder } = require('../../../src/services/orderService');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const orderData = {
      ...body,
      ipAddress: forwardedFor.split(',')[0].trim(),
      userAgent
    };

    const order = createOrder(orderData);
    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order
    }, { status: 201 });
  } catch (err: any) {
    console.error('Order placement API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to place order' }, { status: 400 });
  }
}
