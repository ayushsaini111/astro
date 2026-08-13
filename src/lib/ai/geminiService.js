// src/lib/ai/geminiService.js
import { GoogleGenAI } from '@google/genai';

export const ALL_RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const ALL_PERIODS = ['daily', 'weekly', 'monthly', 'yearly']; // ✅ Added yearly

// Each period uses its own dedicated API key (separate Google projects = separate quotas)
// Key 1 → daily   (20 RPD)
// Key 2 → weekly  (20 RPD)
// Key 3 → monthly (20 RPD)
// Key 4 → yearly  (20 RPD) ✅ Changed from ondemand
const PERIOD_KEYS = {
  daily:   process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY,
  weekly:  process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY,
  monthly: process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY,
  yearly:  process.env.GEMINI_API_KEY_4 || process.env.GEMINI_API_KEY, // ✅ Changed
};

const MODEL_FALLBACK = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

// Free tier: 5 RPM → 5.5s between calls stays safely under
const DELAY_BETWEEN_CALLS_MS = 5500;

export class QuotaError extends Error {
  constructor(msg) { super(msg); this.name = 'QuotaError'; }
}

export class GeminiHoroscopeService {
  constructor(period = 'daily') { // ✅ Changed default from 'ondemand' to 'daily'
    // Pick the right API key for this period
    const apiKey = PERIOD_KEYS[period] || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error(`No API key found for period "${period}". Set GEMINI_API_KEY_1 to _4 in .env.local`);

    this.period    = period;
    this.ai        = new GoogleGenAI({ apiKey });
    this.modelName = MODEL_FALLBACK[0];
    this.lastCallAt = 0;

    this.quotaExhausted = false;
    this.quotaResetAt   = null;

    console.log(`[Gemini] Service init for "${period}" using key: ...${apiKey.slice(-6)}`);
  }

  isQuotaExhausted() {
    if (!this.quotaExhausted) return false;
    if (Date.now() >= (this.quotaResetAt ?? 0)) {
      this.quotaExhausted = false;
      this.quotaResetAt   = null;
      console.log(`[Gemini:${this.period}] ✅ Quota cooldown expired`);
      return false;
    }
    return true;
  }

  quotaSecondsLeft() {
    return Math.max(0, Math.ceil(((this.quotaResetAt ?? 0) - Date.now()) / 1000));
  }

  async _throttle() {
    const elapsed = Date.now() - this.lastCallAt;
    if (elapsed < DELAY_BETWEEN_CALLS_MS) {
      await sleep(DELAY_BETWEEN_CALLS_MS - elapsed);
    }
    this.lastCallAt = Date.now();
  }

  async _call(prompt) {
    if (this.isQuotaExhausted()) {
      throw new QuotaError(`[${this.period}] Quota cooling — ${this.quotaSecondsLeft()}s left`);
    }

    await this._throttle();

    const order = [this.modelName, ...MODEL_FALLBACK.filter(m => m !== this.modelName)];

    for (const model of order) {
      try {
        const interaction = await this.ai.interactions.create({ model, input: prompt });
        const text = interaction.output_text;
        if (!text) throw new Error('Empty output_text');

        if (this.modelName !== model) {
          console.log(`[Gemini:${this.period}] Switched to: ${model}`);
          this.modelName = model;
        }
        return text;

      } catch (err) {
        const msg = String(err?.message ?? '').toLowerCase();

        if (msg.includes('api_key') || msg.includes('api key not valid')) {
          throw new Error(`Invalid API key for ${this.period} — check .env.local`);
        }
        if (msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('429')) {
          this.quotaExhausted = true;
          this.quotaResetAt   = Date.now() + 65_000;
          console.warn(`[Gemini:${this.period}] ⚠️ Quota hit on ${model} — cooling 65s`);
          throw new QuotaError('Quota exceeded');
        }
        if (msg.includes('not found') || msg.includes('not supported') || msg.includes('not available') || msg.includes('no longer available')) {
          console.warn(`[Gemini:${this.period}] "${model}" unavailable — trying next`);
          continue;
        }
        throw new Error(`Gemini (${model}): ${err?.message ?? 'Unknown'}`);
      }
    }

    throw new Error('All Gemini models unavailable');
  }

  // Single horoscope — used for on-demand cache misses
  async generateHoroscope(rashi, date, period) {
    const text = await this._call(buildPrompt(rashi, date, period));
    return parseAndSanitize(text, rashi);
  }

  // Batch — used by cron only, sequential with 5.5s between each call
  async generateBatch(date, period, rashis = ALL_RASHIS) {
    console.log(`[Gemini:${this.period}] Batch ${period} × ${rashis.length} rashis — ~${Math.ceil(rashis.length * DELAY_BETWEEN_CALLS_MS / 1000)}s`);

    const horoscopes = {};
    let   apiCalls   = 0;

    for (let i = 0; i < rashis.length; i++) {
      const rashi = rashis[i];

      if (this.isQuotaExhausted()) {
        console.warn(`[Gemini:${this.period}] Quota — stopping at ${i}/${rashis.length}`);
        break;
      }

      try {
        const text = await this._call(buildPrompt(rashi, date, period));
        apiCalls++;
        horoscopes[rashi.toLowerCase()] = parseAndSanitize(text, rashi);
        console.log(`[Gemini:${this.period}] ✅ ${rashi} (${i + 1}/${rashis.length})`);
      } catch (err) {
        if (err instanceof QuotaError) {
          console.error(`[Gemini:${this.period}] 🛑 Quota at ${rashi} — saved ${Object.keys(horoscopes).length}`);
          break;
        }
        console.error(`[Gemini:${this.period}] ❌ ${rashi}: ${err.message}`);
      }
    }

    console.log(`[Gemini:${this.period}] Done: ${Object.keys(horoscopes).length}/${rashis.length}, ${apiCalls} calls`);
    return { horoscopes, apiCalls };
  }
}

// ── Prompt — detailed, accurate, engaging Vedic content ──────────────────────
// ── Prompt — NO time-specific words (today, this month, etc) ─────────────────
function buildPrompt(rashi, date, period) {
  const d = date instanceof Date ? date : new Date(date);

  const periodContext = {
    daily: `for ${toDateKey(d)}. Focus on the specific planetary positions and their immediate effects.`,
    weekly: `for the week of ${toDateKey(d)}. Cover major planetary movements, peak influences, and cumulative effects.`,
    monthly: `for ${d.toLocaleString('en-US', { month: 'long', year: 'numeric' })}. Analyze major transits, retrograde periods, and lasting impacts.`,
    yearly: `for the year ${d.getFullYear()}. Provide comprehensive predictions covering major planetary transits, eclipses, and retrograde patterns.`,
  }[period] ?? `for ${toDateKey(d)}`;

  const rashiDetails = {
    Aries:       { lord: 'Mars',    element: 'Fire',  nakshatra: 'Ashwini, Bharani, Krittika' },
    Taurus:      { lord: 'Venus',   element: 'Earth', nakshatra: 'Krittika, Rohini, Mrigashira' },
    Gemini:      { lord: 'Mercury', element: 'Air',   nakshatra: 'Mrigashira, Ardra, Punarvasu' },
    Cancer:      { lord: 'Moon',    element: 'Water', nakshatra: 'Punarvasu, Pushya, Ashlesha' },
    Leo:         { lord: 'Sun',     element: 'Fire',  nakshatra: 'Magha, Purva Phalguni, Uttara Phalguni' },
    Virgo:       { lord: 'Mercury', element: 'Earth', nakshatra: 'Uttara Phalguni, Hasta, Chitra' },
    Libra:       { lord: 'Venus',   element: 'Air',   nakshatra: 'Chitra, Swati, Vishakha' },
    Scorpio:     { lord: 'Mars',    element: 'Water', nakshatra: 'Vishakha, Anuradha, Jyeshtha' },
    Sagittarius: { lord: 'Jupiter', element: 'Fire',  nakshatra: 'Mula, Purva Ashadha, Uttara Ashadha' },
    Capricorn:   { lord: 'Saturn',  element: 'Earth', nakshatra: 'Uttara Ashadha, Shravana, Dhanishtha' },
    Aquarius:    { lord: 'Saturn',  element: 'Air',   nakshatra: 'Dhanishtha, Shatabhisha, Purva Bhadrapada' },
    Pisces:      { lord: 'Jupiter', element: 'Water', nakshatra: 'Purva Bhadrapada, Uttara Bhadrapada, Revati' },
  }[rashi] || { lord: 'Unknown', element: 'Unknown', nakshatra: 'Unknown' };

  return `You are a highly experienced Vedic astrologer. Generate an accurate, insightful ${period} horoscope for ${rashi} rashi ${periodContext}

Rashi details:
- Ruling planet: ${rashiDetails.lord}
- Element: ${rashiDetails.element}  
- Nakshatras: ${rashiDetails.nakshatra}

IMPORTANT: Do NOT use time-specific words like "today", "this week", "this month", "this year", "currently". Use neutral phrasing like "the planetary energies show", "during the period", "as the planets transit".

Guidelines:
- GENERAL: 5-6 sentences. Mention specific planets (e.g. "Jupiter's transit through the 9th house"), reference dasha/antardasha energy, cosmic themes. Be specific about opportunities and challenges.
- FINANCE: Mention specific financial actions (investments, savings). Name planets supporting or challenging wealth.
- LOVE: Distinguish between singles and relationships. Mention Venus/Moon influence.
- CAREER: Name favorable activities (negotiations, projects). Mention 10th house lord support.
- HEALTH: Body areas ruled by ${rashi}. Physical and mental wellness tips.
- REMEDIES: Specific to ${rashiDetails.lord}. Include day, color, gemstone, mantra count, donation.

Return ONLY raw JSON (no markdown, no code fences):
{
  "general": "5-6 sentences with planet names, house positions, dasha references (NO 'today', 'this week', etc)",
  "finance": "3 sentences with specific financial guidance and planetary influence",
  "love": "3 sentences covering singles and couples with planetary references",
  "career": "3 sentences with favorable activities and planetary support",
  "health": "3 sentences with body areas, wellness tips, planetary influence",
  "ratings": {"finance": 3, "love": 3, "career": 3, "health": 3},
  "overallRating": 3,
  "luckyDetails": {
    "color": "auspicious color for ${rashiDetails.lord}",
    "number": 7,
    "time": "auspicious time window (e.g. 06:00-08:00 AM)",
    "direction": "auspicious direction",
    "gemstone": "traditional gemstone for ${rashiDetails.lord}",
    "mantra": "Sanskrit mantra for ${rashiDetails.lord} (e.g. Om Namah Shivaya 108 times)"
  },
  "remedies": [
    "Day-specific ritual for ${rashiDetails.lord}",
    "Gemstone or color wearing advice",
    "Mantra with exact count",
    "Food/fast recommendation for ${rashiDetails.lord}",
    "Charity specific to ${rashiDetails.lord}"
  ]
}`;
}

// ── Parse + sanitize ──────────────────────────────────────────────────────────
function parseAndSanitize(text, rashi) {
  let parsed;
  try {
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('No JSON found');
    parsed = JSON.parse(clean.slice(s, e + 1));
  } catch (err) {
    throw new Error(`JSON parse failed: ${err.message}`);
  }

  const clamp = (v, lo = 1, hi = 5) => Math.min(hi, Math.max(lo, parseInt(v) || 3));

  return {
    general: String(parsed.general || `${rashi} planetary energies are active.`),
    finance: String(parsed.finance || 'Financial matters need attention.'),
    love:    String(parsed.love    || 'Relationships bring positivity.'),
    career:  String(parsed.career  || 'Career prospects look favorable.'),
    health:  String(parsed.health  || 'Maintain balance in all activities.'),
    ratings: {
      finance: clamp(parsed.ratings?.finance),
      love:    clamp(parsed.ratings?.love),
      career:  clamp(parsed.ratings?.career),
      health:  clamp(parsed.ratings?.health),
    },
    overallRating: clamp(parsed.overallRating),
    luckyDetails: {
      color:     String(parsed.luckyDetails?.color     || 'Gold'),
      number:    Math.min(9, Math.max(1, parseInt(parsed.luckyDetails?.number) || 7)),
      time:      String(parsed.luckyDetails?.time      || '6:00 AM - 8:00 AM'),
      direction: String(parsed.luckyDetails?.direction || 'East'),
      gemstone:  String(parsed.luckyDetails?.gemstone  || 'Yellow Sapphire'),
      mantra:    String(parsed.luckyDetails?.mantra    || 'Om Namah Shivaya 108 times'),
    },
    remedies: Array.isArray(parsed.remedies) && parsed.remedies.length
      ? parsed.remedies.slice(0, 5).map(String)
      : ['Offer water to the Sun at sunrise', 'Chant Om 108 times', 'Donate to those in need'],
  };
}

export function toDateKey(date) {
  return (date instanceof Date ? date : new Date(date)).toISOString().split('T')[0];
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }