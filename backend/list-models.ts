import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from './src/config';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run().catch(console.error);
