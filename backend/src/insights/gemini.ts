import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { USE_GEMINI, GEMINI_API_KEY } from '../config';
import { runRuleEngine } from './ruleEngine';
import type { FootprintInputs } from '../carbon/engine';
import { InsightsCache } from './cache';

/** Sanitize structured data before embedding in LLM prompts. */
function sanitizeForPrompt(data: unknown): string {
  return JSON.stringify(data).replace(/[\u0000-\u001F\u007F]/g, '');
}

export interface AIInsightResponse {
  summary: string;
  recommendations: Array<{
    category: string;
    action: string;
    estimated_annual_savings_kg: number;
  }>;
  source: 'gemini' | 'rules';
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const AI_MODELS = ['gemini-2.5-flash', 'gemini-3.1-flash'];
const insightsCache = new InsightsCache<AIInsightResponse>();

/**
 * Generate highly personalized carbon reduction insights via Google Gemini.
 * Uses a strict JSON schema for reliable parsing.
 */
export async function generateInsights(breakdown: Record<string, number>, inputs: FootprintInputs): Promise<AIInsightResponse> {
  const cacheKey = InsightsCache.hashKey(breakdown, inputs);
  const cached = insightsCache.get(cacheKey);
  if (cached) {
    console.log('🤖 Serving AI insights from cache');
    return cached;
  }

  // Graceful Fallback if Gemini is disabled or not configured
  if (!USE_GEMINI || !GEMINI_API_KEY) {
    console.log('🤖 Gemini AI disabled or missing API key. Falling back to static Rule Engine.');
    const rules = runRuleEngine(breakdown, inputs);
    return { ...rules, source: 'rules' };
  }

  const prompt = `
    You are an expert environmental coach. Provide 4 to 6 highly personalized, actionable recommendations to help the user lower their carbon footprint.
    
    User Profile:
    - Breakdown: ${sanitizeForPrompt(breakdown)}
    - Specific Habits: ${sanitizeForPrompt(inputs)}

    Rules:
    1. Provide exactly 4 to 6 recommendations.
    2. If a user is doing well in a category (e.g. 0 flights), give them a 'Good' rating and encourage them to keep it up with 0 savings.
    3. For high emissions, give a 'Bad' or 'Moderate' rating with specific reduction strategies.
    4. Ensure you cover multiple categories (transport, home, diet, consumption) based on where their emissions are highest.
  `;

  let lastError: unknown;

  for (const modelName of AI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2, // Low temperature for high consistency and logical adherence
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              summary: {
                type: SchemaType.STRING,
                description: 'A 2-sentence encouraging coach summary comparing their total emissions to the sustainable 2.0 tonne target.',
              },
              recommendations: {
                type: SchemaType.ARRAY,
                description: 'A list of exact 4 to 6 distinct recommendations based on the user footprint habits.',
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    category: {
                      type: SchemaType.STRING,
                      description: 'Must be exactly one of: transport, home, diet, consumption',
                    },
                    action: {
                      type: SchemaType.STRING,
                      description: 'Format: "[Emoji] [Short Title]: [1 sentence actionable advice] ([Good|Moderate|Bad])"',
                    },
                    estimated_annual_savings_kg: {
                      type: SchemaType.INTEGER,
                      description: 'Conservative integer estimate of kg CO2 saved per year if followed.',
                    },
                  },
                  required: ['category', 'action', 'estimated_annual_savings_kg'],
                },
              },
            },
            required: ['summary', 'recommendations'],
          },
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      let parsed: AIInsightResponse;
      try {
        parsed = JSON.parse(responseText);
        parsed.source = 'gemini';
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse JSON from ${modelName}, skipping to next model:`, parseError);
        lastError = parseError;
        continue;
      }

      // Fallback if AI hallucinates fewer than 4 or more than 6 recommendations
      if (!parsed.recommendations || parsed.recommendations.length < 4 || parsed.recommendations.length > 6) {
          console.warn(`⚠️ ${modelName} returned ${parsed.recommendations?.length} recommendations (expected 4-6). Skipping to next model.`);
          lastError = new Error('Hallucinated recommendation count');
          continue;
      }

      insightsCache.set(cacheKey, parsed);
      return parsed;

    } catch (error) {
      console.warn(`⚠️ Gemini model ${modelName} failed:`, error);
      lastError = error;
    }
  }

  console.error('❌ All Gemini models failed. Last error:', lastError);
  // Fallback to offline rule engine
  const rules = runRuleEngine(breakdown, inputs);
  return { ...rules, source: 'rules' };
}
