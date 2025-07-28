
'use server';

/**
 * @fileOverview A flow that enhances a user's prompt to be more descriptive and artistic.
 *
 * - enhancePrompt - A function that takes a simple prompt and enhances it.
 * - EnhancePromptInput - The input type for the enhancePrompt function.
 * - EnhancePromptOutput - The return type for the enhancePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePromptInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt to enhance.'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedPrompt: z.string().describe("The enhanced, more descriptive prompt."),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

export async function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  return enhancePromptFlow(input);
}

const promptEnhancer = ai.definePrompt({
  name: 'promptEnhancer',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  prompt: `You are an expert prompt engineer for a generative AI image service. Your task is to take a user's simple prompt and enhance it into a rich, descriptive, and artistic prompt that will generate a beautiful image.

Focus on adding details about:
- **Visual Style:** (e.g., 'digital painting', 'cinematic 3d render', 'Studio Ghibli anime style', 'photorealistic')
- **Lighting:** (e.g., 'dramatic lighting', 'soft morning light', 'cinematic rim lighting')
- **Details:** Add specific details about the subject and background.
- **Composition:** (e.g., 'wide angle shot', 'close-up portrait')
- **Quality:** Add keywords like 'masterpiece', 'high detail', 'sharp focus'.

DO NOT change the core subject of the user's prompt. Only enhance it.

User Prompt: {{{prompt}}}
`,
});

const enhancePromptFlow = ai.defineFlow(
  {
    name: 'enhancePromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async input => {
    const {output} = await promptEnhancer(input);
    return output!;
  }
);
