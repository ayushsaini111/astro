import { NextResponse } from 'next/server';
import { Pool } from 'pg';

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

// ============================================================================
// GET — /backend/poojas/testimonials?poojaId=123
// ============================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const poojaId = searchParams.get('poojaId');

    if (!poojaId) {
      return NextResponse.json(
        { success: false, error: 'poojaId is required' },
        { status: 400 }
      );
    }

    const testimonials = await query(
      `SELECT * FROM pooja_testimonials WHERE pooja_id = $1 ORDER BY created_at DESC`,
      [parseInt(poojaId)]
    );

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error('Error fetching pooja testimonials:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// CREATE — POST /backend/poojas/testimonials
// ============================================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const { pooja_id, name, location, rating, text } = body;

    if (!pooja_id || !name || !text) {
      return NextResponse.json(
        { success: false, error: 'pooja_id, name, and text are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO pooja_testimonials (pooja_id, name, location, rating, text, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [parseInt(pooja_id), name, location || null, rating ? parseInt(rating) : 5, text]
    );

    return NextResponse.json({ success: true, testimonial: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating pooja testimonial:', error);
    if (error.code === '23503') {
      return NextResponse.json(
        { success: false, error: 'Pooja not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// UPDATE — PUT /backend/poojas/testimonials
// ============================================================================
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, location, rating, text } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Testimonial ID is required' },
        { status: 400 }
      );
    }

    if (!name || !text) {
      return NextResponse.json(
        { success: false, error: 'name and text are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE pooja_testimonials
       SET name = $1, location = $2, rating = $3, text = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, location || null, rating ? parseInt(rating) : 5, text, parseInt(id)]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, testimonial: result[0] });
  } catch (error) {
    console.error('Error updating pooja testimonial:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE — DELETE /backend/poojas/testimonials?id=123
// ============================================================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Testimonial ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM pooja_testimonials WHERE id = $1 RETURNING id`,
      [parseInt(id)]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully',
      id: result[0].id,
    });
  } catch (error) {
    console.error('Error deleting pooja testimonial:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}