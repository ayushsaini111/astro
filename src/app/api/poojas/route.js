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

// ============================================================================
// CREATE — POST /api/poojas
// ============================================================================
export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const {
      title,
      short_description,
      description,
      price,
      offer_price,
      duration,
      mode,
      image,
      rating,
      bookings,
      popular,
      category,
      filter,
      languages, // array of strings e.g. ["Hindi", "English"]
    } = body;

    // Basic validation
    if (!title || price === undefined || offer_price === undefined || !mode || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price, offer_price, mode, category' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const insertSql = `
      INSERT INTO poojas 
        (title, short_description, description, price, offer_price, duration, 
         mode, image, rating, bookings, popular, category, filter, created_at, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      title,
      short_description || null,
      description || null,
      price,
      offer_price,
      duration || null,
      mode,
      image || null,
      rating || 0,
      bookings || '0',
      popular ?? false,
      category,
      filter || null,
    ];

    const result = await client.query(insertSql, values);
    const newPooja = result.rows[0];

    // Insert languages if provided
    if (Array.isArray(languages) && languages.length > 0) {
      const langPlaceholders = languages.map((_, i) => `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO pooja_languages (pooja_id, language) VALUES ${langPlaceholders}`,
        [newPooja.id, ...languages]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        ...newPooja,
        price: parseFloat(newPooja.price),
        offer_price: parseFloat(newPooja.offer_price),
        rating: parseFloat(newPooja.rating),
        language: languages || [],
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating pooja:', error);
    return NextResponse.json(
      { error: 'Failed to create pooja', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ============================================================================
// UPDATE — PUT /api/poojas
// ============================================================================
export async function PUT(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const {
      id,
      title,
      short_description,
      description,
      price,
      offer_price,
      duration,
      mode,
      image,
      rating,
      bookings,
      popular,
      category,
      filter,
      languages,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Pooja ID is required' }, { status: 400 });
    }

    if (!title || price === undefined || offer_price === undefined || !mode || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price, offer_price, mode, category' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const updateSql = `
      UPDATE poojas SET
        title = $1,
        short_description = $2,
        description = $3,
        price = $4,
        offer_price = $5,
        duration = $6,
        mode = $7,
        image = $8,
        rating = $9,
        bookings = $10,
        popular = $11,
        category = $12,
        filter = $13,
        updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `;

    const values = [
      title,
      short_description || null,
      description || null,
      price,
      offer_price,
      duration || null,
      mode,
      image || null,
      rating || 0,
      bookings || '0',
      popular ?? false,
      category,
      filter || null,
      id,
    ];

    const result = await client.query(updateSql, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Pooja not found' }, { status: 404 });
    }

    const updatedPooja = result.rows[0];

    // Replace languages (delete old, insert new)
    await client.query('DELETE FROM pooja_languages WHERE pooja_id = $1', [id]);

    if (Array.isArray(languages) && languages.length > 0) {
      const langPlaceholders = languages.map((_, i) => `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO pooja_languages (pooja_id, language) VALUES ${langPlaceholders}`,
        [id, ...languages]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      ...updatedPooja,
      price: parseFloat(updatedPooja.price),
      offer_price: parseFloat(updatedPooja.offer_price),
      rating: parseFloat(updatedPooja.rating),
      language: languages || [],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating pooja:', error);
    return NextResponse.json(
      { error: 'Failed to update pooja', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ============================================================================
// DELETE — DELETE /api/poojas?id=123
// ============================================================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Pooja ID is required' }, { status: 400 });
    }

    const result = await query('DELETE FROM poojas WHERE id = $1 RETURNING id', [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Pooja not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pooja deleted successfully',
      id: result[0].id,
    });
  } catch (error) {
    console.error('Error deleting pooja:', error);
    return NextResponse.json(
      { error: 'Failed to delete pooja', details: error.message },
      { status: 500 }
    );
  }
}