import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query must be at least 2 characters' 
      }, { status: 400 });
    }
    
    const cleanQuery = query.trim();
    console.log(`🔍 Searching places for: "${cleanQuery}"`);
    
    // Try primary search with Nominatim
    const places = await searchWithNominatim(cleanQuery);
    
    if (places.length === 0) {
      // Fallback to broader search
      const fallbackPlaces = await searchWithFallback(cleanQuery);
      return NextResponse.json({ 
        success: true, 
        places: fallbackPlaces,
        source: 'fallback'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      places,
      source: 'nominatim'
    });
    
  } catch (error) {
    console.error('❌ Place search error:', error.message);
    
    // Return empty results instead of error for better UX
    return NextResponse.json({ 
      success: true, 
      places: [],
      error: 'Search temporarily unavailable'
    });
  }
}

async function searchWithNominatim(query) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: query,
          format: 'json',
          limit: 10,
          countrycodes: 'in', // Focus on India
          addressdetails: 1,
          dedupe: 1
        },
        headers: {
          'User-Agent': 'Astrology App/1.0',
          'Accept-Language': 'en'
        },
        timeout: 8000
      }
    );
    
    return formatPlaces(response.data);
  } catch (error) {
    console.error('Nominatim search failed:', error.message);
    return [];
  }
}

async function searchWithFallback(query) {
  try {
    // Broader search without country restriction
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: query,
          format: 'json',
          limit: 5,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'Astrology App/1.0'
        },
        timeout: 5000
      }
    );
    
    return formatPlaces(response.data);
  } catch (error) {
    console.error('Fallback search failed:', error.message);
    return [];
  }
}

function formatPlaces(data) {
  if (!Array.isArray(data)) return [];
  
  return data
    .map(place => ({
      display_name: place.display_name || place.name || 'Unknown',
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      type: place.type || 'place',
      importance: parseFloat(place.importance) || 0
    }))
    .filter(place => 
      !isNaN(place.lat) && 
      !isNaN(place.lng) && 
      place.display_name !== 'Unknown'
    )
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);
}