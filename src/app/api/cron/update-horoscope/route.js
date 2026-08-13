import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import moment from "moment";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Verify cron job authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const today = moment().format('YYYY-MM-DD');
    
    console.log(`🔄 Starting daily horoscope update for ${today}`);
    
    // Check if today's horoscope already exists
    const existing = await prisma.dailyHoroscope.findUnique({
      where: { date: new Date(today) }
    });
    
    if (existing && existing.isActive) {
      console.log(`✅ Horoscope for ${today} already exists`);
      return NextResponse.json({
        success: true,
        message: 'Horoscope already exists',
        date: today
      });
    }
    
    // Fetch fresh horoscope data
    const horoscopeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/horoscope/sources`);
    const horoscopeData = await horoscopeResponse.json();
    
    if (!horoscopeData.success) {
      throw new Error('Failed to fetch horoscope data');
    }
    
    // Save to database
    await prisma.dailyHoroscope.upsert({
      where: { date: new Date(today) },
      update: {
        content: horoscopeData.horoscope,
        source: 'MULTI_SOURCE',
        accuracy: 0.85,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        date: new Date(today),
        content: horoscopeData.horoscope,
        source: 'MULTI_SOURCE',
        accuracy: 0.85,
        isActive: true
      }
    });
    
    // Update planetary transits
    await updatePlanetaryTransits(today);
    
    // Cleanup old horoscopes (keep last 30 days)
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    await prisma.dailyHoroscope.deleteMany({
      where: {
        date: { lt: thirtyDaysAgo }
      }
    });
    
    console.log(`✅ Horoscope updated successfully for ${today}`);
    
    return NextResponse.json({
      success: true,
      message: 'Horoscope updated successfully',
      date: today,
      accuracy: 0.85
    });
    
  } catch (error) {
    console.error('Horoscope update error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

async function updatePlanetaryTransits(date) {
  try {
    // Calculate planetary positions for the day
    const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
    
    for (const planet of planets) {
      const position = await calculatePlanetPosition(planet, date);
      
      await prisma.planetaryTransit.upsert({
        where: {
          date_planetName: {
            date: new Date(date),
            planetName: planet
          }
        },
        update: position,
        create: {
          date: new Date(date),
          planetName: planet,
          ...position
        }
      });
    }
    
    console.log(`✅ Planetary transits updated for ${date}`);
  } catch (error) {
    console.error('Planetary transit update error:', error);
  }
}

async function calculatePlanetPosition(planet, date) {
  // Simplified planetary position calculation
  // In production, use Swiss Ephemeris or NASA data
  const basePositions = {
    sun: 280, moon: 120, mars: 45, mercury: 310,
    jupiter: 210, venus: 150, saturn: 90
  };
  
  const dayOfYear = moment(date).dayOfYear();
  const longitude = (basePositions[planet] + dayOfYear * 0.98565) % 360;
  
  return {
    longitude,
    sign: getZodiacSign(longitude),
    degree: longitude % 30,
    speed: planet === 'moon' ? 13.2 : planet === 'sun' ? 1.0 : Math.random() * 2,
    isRetrograde: Math.random() > 0.9 // 10% chance of retrograde
  };
}

function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(longitude / 30)];
}