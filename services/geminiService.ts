import { GoogleGenAI } from "@google/genai";

// Define local interface for type safety since global declaration was removed
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

export const checkApiKey = async (): Promise<boolean> => {
  // Safe access to window.aistudio avoiding global type conflicts
  const aistudio = (window as any).aistudio as AIStudio | undefined;
  if (aistudio && aistudio.hasSelectedApiKey) {
    return await aistudio.hasSelectedApiKey();
  }
  return false;
};

export const requestApiKey = async (): Promise<void> => {
  const aistudio = (window as any).aistudio as AIStudio | undefined;
  if (aistudio && aistudio.openSelectKey) {
    await aistudio.openSelectKey();
  } else {
    console.warn("AI Studio window object not found");
  }
};

export const generateExpandedWallpaper = async (
  imageBase64: string,
  mimeType: string,
  stylePrompt: string = "Ensure the generated content matches the original image style exactly.",
  useProModel: boolean = false
): Promise<string> => {
  // Create a new instance for every request to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Task: Transform the attached portrait image into a 16:9 landscape wallpaper by generating content for the empty side areas.

    **PRIMARY DIRECTIVE: ABSOLUTE VISUAL CONSISTENCY**
    The generated extensions must look like they were part of the original scene. 
    1. **Seamless Blending**: The transition between the original image and the generated extensions must be invisible.
    2. **Lighting & Color**: Match the original image's lighting direction, intensity, color grading, and white balance exactly.
    3. **Texture & Quality**: Replicate the original image's film grain, noise level, and sharpness. Do not generate overly smooth or "plastic" looking areas if the original is grainy.
    4. **Context**: Continue background elements (buildings, landscapes, patterns) logically and naturally.

    **Style Instruction**: ${stylePrompt}
    
    Note: Even if a specific style is requested, the transition quality and coherence with the original central image is the highest priority. If the style directive conflicts with the original image's integrity, prioritize matching the original image's visual traits.
  `;

  const model = useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  // Construct config dynamically based on model capabilities
  const imageConfig: any = {
    aspectRatio: "16:9",
  };

  if (useProModel) {
    // Only Pro model supports imageSize for upscaling/high-res
    imageConfig.imageSize = "2K"; 
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
      config: {
        imageConfig: imageConfig,
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No content generated");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};