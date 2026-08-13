import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // 'online' or 'onsite'

    let sql = `
      SELECT p.*, 
             COALESCE(
               STRING_AGG(pl.language, ',' ORDER BY pl.language), 
               ''
             ) as languages
      FROM poojas p
      LEFT JOIN pooja_languages pl ON p.id = pl.pooja_id
    `;
    
    const params = [];
    
    if (category) {
      sql += ' WHERE p.category = $1';
      params.push(category);
    }
    
    sql += ' GROUP BY p.id ORDER BY p.popular DESC, p.created_at DESC';

    const poojas = await query(sql, params);
    
    // Format the response
    const formattedPoojas = poojas.map(pooja => ({
      ...pooja,
      language: pooja.languages ? pooja.languages.split(',').filter(lang => lang) : [],
      price: parseFloat(pooja.price),
      offer_price: parseFloat(pooja.offer_price),
      rating: parseFloat(pooja.rating)
    }));

    return NextResponse.json(formattedPoojas);
  } catch (error) {
    console.error('Error fetching poojas:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch poojas',
      details: error.message 
    }, { status: 500 });
  }
}