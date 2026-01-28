import { z } from 'zod';

/**
 * AI Teaching Tool
 * Provides adaptive learning and teaching capabilities for BoDiGi applications
 */

export const aiTeachingSchema = z.object({
  topic: z.string().describe('The topic to teach'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).describe('Learning level'),
  format: z.enum(['explanation', 'example', 'practice']).optional().describe('Teaching format'),
});

export type AiTeachingInput = z.infer<typeof aiTeachingSchema>;

export async function executeAiTeaching(input: AiTeachingInput): Promise<string> {
  const { topic, level, format = 'explanation' } = input;

  // Generate teaching content based on topic and level
  const content = {
    beginner: `# Introduction to ${topic}\n\nThis is a beginner-friendly introduction. We'll start with the basics and build up your understanding gradually.`,
    intermediate: `# ${topic} - Intermediate Level\n\nBuilding on foundational knowledge, let's explore more advanced concepts and practical applications.`,
    advanced: `# Advanced ${topic}\n\nDeep dive into sophisticated techniques, edge cases, and expert-level insights.`,
  };

  const formatTemplates = {
    explanation: `${content[level]}\n\n## Key Concepts\n- Core principles explained clearly\n- Real-world context\n- Common misconceptions addressed`,
    example: `${content[level]}\n\n## Practical Examples\n\`\`\`\n// Example code or scenario\n\`\`\`\n\n## Step-by-step walkthrough`,
    practice: `${content[level]}\n\n## Practice Exercise\n1. Try this challenge\n2. Apply what you learned\n3. Review and reflect`,
  };

  return formatTemplates[format];
}

export const aiTeachingTool = {
  name: 'ai_teaching',
  description:
    'Provides adaptive AI teaching for various topics and skill levels. Helps applications deliver personalized learning experiences.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      topic: {
        type: 'string',
        description: 'The topic to teach',
      },
      level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: 'Learning level',
      },
      format: {
        type: 'string',
        enum: ['explanation', 'example', 'practice'],
        description: 'Teaching format (optional)',
      },
    },
    required: ['topic', 'level'],
  },
};
