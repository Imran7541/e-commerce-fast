import { NextResponse } from 'next/server';
const db = require('../../../../src/db/database');

export async function GET() {
  try {
    const products = db.all(`
      SELECT p.id, p.name, p.slug, p.sku, p.price, p.sale_price as salePrice, 
             p.stock, p.status, p.image, c.name as categoryName
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.stock ASC, p.id DESC
    `);
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, stock } = await request.json();
    if (id === undefined || stock === undefined || isNaN(stock)) {
      return NextResponse.json({ error: 'Valid product id and stock count required' }, { status: 400 });
    }

    const newStock = Math.max(0, parseInt(stock, 10));
    db.run(`UPDATE products SET stock = ? WHERE id = ?`, [newStock, id]);

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
      id,
      stock: newStock
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
