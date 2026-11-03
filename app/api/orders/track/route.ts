import { NextResponse } from 'next/server';
const db = require('../../../../src/db/database');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const phone = searchParams.get('phone');

    if (!orderNumber && !phone) {
      return NextResponse.json({ error: 'Order number or phone number is required' }, { status: 400 });
    }

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: string[] = [];

    if (orderNumber) {
      sql += ' AND order_number = ?';
      params.push(orderNumber.trim());
    }
    if (phone) {
      sql += ' AND phone = ?';
      params.push(phone.trim());
    }

    sql += ' ORDER BY id DESC LIMIT 5';
    const orders = db.all(sql, params);

    const formatted = orders.map((o: any) => {
      const items = db.all('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        phone: o.phone,
        address: o.address,
        district: o.district,
        thana: o.thana,
        subtotal: o.subtotal,
        shippingCost: o.shipping_cost,
        discount: o.discount,
        total: o.total,
        status: o.status,
        courier: o.courier,
        courierTrackingCode: o.courier_tracking_code,
        createdAt: o.created_at,
        items: items.map((i: any) => ({
          id: i.id,
          productName: i.product_name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          totalPrice: i.total_price,
          image: i.image,
        })),
      };
    });

    return NextResponse.json({ success: true, orders: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
