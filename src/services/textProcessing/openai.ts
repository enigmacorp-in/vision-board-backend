import { OpenAI } from 'openai';
import { TextProcessingOptions, TextProcessingResult, TextProcessingService } from './types';

export class OpenAITextProcessor implements TextProcessingService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processGoals(options: TextProcessingOptions): Promise<TextProcessingResult> {
    const preprocessingPrompt = [
      "Extract specific visual elements that directly represent these goals. Focus only on what's mentioned, no extra elements.",
      "Here are examples of how to extract visual elements from different types of goals:",
      "Goal: 'start a bakery business'",
      "Visual elements: professional kitchen with baking equipment, fresh bread and pastries, cozy bakery storefront, baker in action",
      "",
      "Goal: 'run a marathon'",
      "Visual elements: running shoes on track, marathon training schedule, runner at sunrise, finish line celebration",
      "",
      "Goal: 'learn to play guitar'",
      "Visual elements: acoustic guitar in practice room, music sheets, guitar lessons, fingers on fretboard",
      "",
      "Goal: 'travel to Japan'",
      "Visual elements: Mount Fuji view, traditional Japanese garden, Tokyo city lights, bullet train journey",
      "",
      "Original goals:",
      ...options.goals.map((goal: string) => `- ${goal}`),
      "\nNow, respond with specific visual elements for these goals, one element per line. Make them realistic and directly related to each goal:"
    ].join('\n');

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional vision board designer who specializes in translating life goals into specific, meaningful visual elements. Focus on realistic, achievable representations that directly connect to each goal."
        },
        {
          role: "user",
          content: preprocessingPrompt
        }
      ],
      temperature: 0.3
    });

    if (!completion.choices[0].message.content) {
      throw new Error('Failed to extract themes from goals');
    }

    const visualElements = completion.choices[0].message.content
      .split('\n')
      .filter(theme => theme.trim() !== '')
      .map(theme => theme.trim());

    // Generate vision board prompt
    const prompt = [
      `Create a realistic vision board collage that specifically represents these goals: ${options.goals.join(', ')}.`,
      'Style requirements:',
      '- Use only high-quality, photorealistic images that directly represent the goals',
      '- Create a natural-looking collage with meaningful overlaps between related elements',
      '- Include these specific visual elements, making sure each goal is clearly represented:',
      visualElements.map(theme => `  - ${theme}`).join('\n'),
      '- Make each image look authentic and achievable, not overly staged',
      '- Use colors and lighting that create a cohesive, inspiring mood',
      '- Keep the focus on real-world representations of the goals',
      '- Ensure each goal gets equal visual importance in the layout',
      '- Add subtle depth with shadows and layering, like a physical vision board',
      'Make it look like a personal, achievable vision board that someone would create by taking images from pinterest and putting them together in canvas.'
    ].join('\n');

    return {
      prompt,
      visualElements
    };
  }
} 