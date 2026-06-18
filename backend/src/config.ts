import dotenv from 'dotenv';
dotenv.config();

export const PORT = parseInt(process.env.PORT || '5000', 10);
export const ENV = process.env.NODE_ENV || process.env.ENV || 'development';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '';

// Google Cloud Settings
export const PROJECT_ID = process.env.PROJECT_ID || 'gen-lang-client-0027231059';
export const REGION = process.env.REGION || 'us-central1';

// Auto-enable Gemini when an API key is present (USE_GEMINI=false can still explicitly disable)
export const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const geminiFlag = process.env.USE_GEMINI ?? (GEMINI_API_KEY ? 'true' : 'false');
export const USE_GEMINI = geminiFlag.toLowerCase() === 'true' && GEMINI_API_KEY.length > 0;

export const USE_FIRESTORE = (process.env.USE_FIRESTORE || 'false').toLowerCase() === 'true';
