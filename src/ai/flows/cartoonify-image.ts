// src/ai/flows/cartoonify-image.ts
'use server';

/**
 * @fileOverview A flow that cartoonifies an image provided as a data URI, or generates an image from a prompt.
 *
 * - cartoonifyImage - A function that handles the image generation process.
 * - CartoonifyImageInput - The input type for the cartoonifyImage function.
 * - CartoonifyImageOutput - The return type for the cartoonifyImage function.
 */

import { ai } from '@/ai/genkit';
import { z, MediaPart } from 'genkit';

const CartoonifyImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo to cartoonify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is optional."
    ),
  prompt: z.string().describe('A prompt to guide the image generation style.'),
});
export type CartoonifyImageInput = z.infer<typeof CartoonifyImageInputSchema>;

const CartoonifyImageOutputSchema = z.object({
  cartoonifiedDataUri: z
    .string()
    .describe("The generated image, as a data URI."),
});
export type CartoonifyImageOutput = z.infer<typeof CartoonifyImageOutputSchema>;

export async function cartoonifyImage(input: CartoonifyImageInput): Promise<CartoonifyImageOutput> {
  return cartoonifyImageFlow(input);
}

const cartoonifyImageFlow = ai.defineFlow(
  {
    name: 'cartoonifyImageFlow',
    inputSchema: CartoonifyImageInputSchema,
    outputSchema: CartoonifyImageOutputSchema,
  },
  async input => {
    const promptParts: (
      { text: string } | MediaPart
    )[] = [];
    let textPrompt = "";

    const masterPrompt = `You are a master digital artist specializing in creating exquisite, high-fidelity 3D character renders. Your task is to generate an image that exemplifies the pinnacle of digital art, characterized by its cinematic quality, impeccable detail, and sophisticated lighting.

**Core Instructions:**
1.  **Artistic Style:** The final image must be a **highly detailed, master-quality 3D render**. It should have a polished, cinematic feel, akin to a character portrait from a major animation studio. The style should be guided by the user's prompt: **${input.prompt}**.
2.  **Impeccable Detail:** Pay extreme attention to the fine details. This includes:
    *   **Skin:** Soft, realistic textures with subtle pores and imperfections.
    *   **Hair:** Individually rendered strands with realistic sheen and shadow.
    *   **Eyes:** Expressive and lifelike, with detailed irises and realistic reflections of the light sources.
    *   **Fabric:** The texture and weave of clothing should be palpable.
3.  **Cinematic Lighting:** Employ a sophisticated, multi-point lighting setup.
    *   **Key Light:** A primary light source to define the subject's form.
    *   **Fill Light:** A softer light to fill in shadows and reveal detail.
    *   **Rim Light:** A subtle light from behind to create a halo effect, separating the subject from the background and highlighting their silhouette.
    *   The lighting should create a sense of depth, mood, and drama.
4.  **Composition and Subject Integrity:**
    *   If an image is provided, **strictly adhere to the original subject, pose, and composition.** Do not alter the fundamental elements. Your task is to re-imagine the subject in the requested 3D-rendered style, not to change the scene.
    *   If no image is provided, generate a compelling portrait based on the user's prompt.
5.  **Quality Benchmark:** The final output must be an ultra-high-resolution masterpiece, suitable for a professional art portfolio. Do not apply a simple filter; this is a from-scratch generation based on detailed instructions.`;

    if (input.photoDataUri) {
      promptParts.push({ media: { url: input.photoDataUri } });
      textPrompt = `Analyze the provided image as the primary subject reference. Using that reference, execute the following master instructions:

${masterPrompt}`;
    } else {
      textPrompt = `Execute the following master instructions to generate an image from the user's prompt:

${masterPrompt}`;
    }

    promptParts.push({ text: textPrompt }); // Modified line to use { text: ... }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error("Image generation failed: No media URL returned.");
    }

    return { cartoonifiedDataUri: media.url! };
  }
);
