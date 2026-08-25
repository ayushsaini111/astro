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

export async function GET(request, { params }) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid pooja ID' }, { status: 400 });
    }

    const sql = `
      SELECT p.*, 
             COALESCE(
               STRING_AGG(pl.language, ',' ORDER BY pl.language), 
               ''
             ) as languages
      FROM poojas p
      LEFT JOIN pooja_languages pl ON p.id = pl.pooja_id
      WHERE p.id = $1
      GROUP BY p.id
    `;

    const result = await query(sql, [parseInt(id)]);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Pooja not found' }, { status: 404 });
    }

    const pooja = {
      ...result[0],
      language: result[0].languages ? result[0].languages.split(',').filter(lang => lang) : [],
      price: parseFloat(result[0].price),
      offer_price: parseFloat(result[0].offer_price),
      rating: parseFloat(result[0].rating)
    };
    console.log("ll",pooja)

    return NextResponse.json(pooja);
  } catch (error) {
    console.error('Error fetching pooja:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch pooja',
      details: error.message 
    }, { status: 500 });
  }
}