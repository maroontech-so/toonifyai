import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("❌ GEMINI_API_KEY is missing in the .env file.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey, // ✅ Clean and safe
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
