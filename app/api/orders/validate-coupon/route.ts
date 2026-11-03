import { NextResponse } from 'next/server';
const { validateCoupon } = require('../../../../src/services/orderService');

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();
    const result = validateCoupon(code, subtotal);
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 400 });
  }
}
