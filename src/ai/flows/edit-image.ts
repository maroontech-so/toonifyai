
// src/ai/flows/edit-image.ts
'use server';

/**
 * @fileOverview A flow that edits an image based on a user's text prompt.
 *
 * - editImage - A function that handles the image editing process.
 * - EditImageInput - The input type for the editImage function.
 * - EditImageOutput - The return type for the editImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MediaPart } from 'genkit/cohere';

const EditImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The photo to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('A detailed prompt describing the desired edit.'),
});
export type EditImageInput = z.infer<typeof EditImageInputSchema>;

const EditImageOutputSchema = z.object({
  editedDataUri: z
    .string()
    .describe("The edited image, as a data URI."),
});
export type EditImageOutput = z.infer<typeof EditImageOutputSchema>;

export async function editImage(input: EditImageInput): Promise<EditImageOutput> {
  return editImageFlow(input);
}

const editImageFlow = ai.defineFlow(
  {
    name: 'editImageFlow',
    inputSchema: EditImageInputSchema,
    outputSchema: EditImageOutputSchema,
  },
  async input => {
    
    const promptParts: (string | MediaPart)[] = [];
    
    promptParts.push({media: {url: input.photoDataUri}});

    const textPrompt = `You are a precise and intelligent photo editing assistant. Your task is to edit the provided image based *exactly* on the user's instructions.

    **Editing Instruction:** "${input.prompt}"

    **Critical Rules:**
    1.  **Preserve Subject Identity:** It is absolutely essential that you DO NOT distort, alter, or change the subject's face and body features. The person in the edited image must look exactly like the person in the original image.
    2.  **Analyze the Request**: Carefully read the editing instruction to understand the user's goal.
    3.  **Preserve the Original**: Maintain all other aspects of the original image that are not related to the editing instruction. Do not change the composition or overall style unless the instruction requires it.
    4.  **Execute Precisely**: Apply the requested change accurately. For example, if asked to "remove the background," you must isolate the subject and make the background transparent. If asked to "change the shirt color to red," only the shirt color should change.
    5.  **High-Quality Output**: Ensure the final image is clean, with no artifacts from the editing process. The edit should look natural and seamless.

    Do not interpret the request as a stylistic change. Perform a direct, precise edit based on the user's command while strictly preserving the subject's original features.`;
    
    promptParts.push({text: textPrompt});

    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-preview-image-generation model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    return {editedDataUri: media.url!};
  }
);
