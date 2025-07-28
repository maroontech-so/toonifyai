
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-article.ts';
import '@/ai/flows/suggest-quiz-question.ts';
import '@/ai/flows/cartoonify-image.ts';
import '@/ai/flows/describe-image.ts';
import '@/ai/flows/edit-image.ts';
import '@/ai/flows/enhance-prompt.ts';

