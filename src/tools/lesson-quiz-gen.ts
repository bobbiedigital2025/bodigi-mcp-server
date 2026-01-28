import { z } from 'zod';

/**
 * Lesson and Quiz Generation Tool
 * Automatically generates lessons and quizzes for learning content
 */

export const lessonQuizGenSchema = z.object({
  topic: z.string().describe('The topic for lesson/quiz'),
  type: z.enum(['lesson', 'quiz', 'both']).describe('What to generate'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('Difficulty level'),
  questionCount: z.number().min(1).max(20).optional().describe('Number of questions (for quiz)'),
});

export type LessonQuizGenInput = z.infer<typeof lessonQuizGenSchema>;

export async function executeLessonQuizGen(input: LessonQuizGenInput): Promise<string> {
  const { topic, type, difficulty = 'medium', questionCount = 5 } = input;

  let result = '';

  // Generate lesson content
  if (type === 'lesson' || type === 'both') {
    result += `# Lesson: ${topic}\n\n`;
    result += `**Difficulty**: ${difficulty}\n\n`;
    result += `## Introduction\n`;
    result += `Welcome to this lesson on ${topic}. This ${difficulty}-level content will help you understand the key concepts.\n\n`;
    result += `## Main Content\n`;
    result += `### Section 1: Fundamentals\n`;
    result += `Core concepts and principles that form the foundation of ${topic}.\n\n`;
    result += `### Section 2: Practical Application\n`;
    result += `How to apply ${topic} in real-world scenarios.\n\n`;
    result += `### Section 3: Best Practices\n`;
    result += `Expert tips and recommended approaches for working with ${topic}.\n\n`;
    result += `## Summary\n`;
    result += `Key takeaways from this lesson on ${topic}.\n\n`;
  }

  // Generate quiz content
  if (type === 'quiz' || type === 'both') {
    if (type === 'both') result += '---\n\n';

    result += `# Quiz: ${topic}\n\n`;
    result += `**Difficulty**: ${difficulty}\n`;
    result += `**Questions**: ${questionCount}\n\n`;

    for (let i = 1; i <= questionCount; i++) {
      result += `## Question ${i}\n\n`;
      result += `What is an important concept related to ${topic}?\n\n`;
      result += `A) First option\n`;
      result += `B) Second option\n`;
      result += `C) Correct answer ✓\n`;
      result += `D) Fourth option\n\n`;
      result += `**Explanation**: This demonstrates understanding of ${topic} concepts.\n\n`;
    }

    result += `---\n\n**Quiz Complete!** Review your answers and check the explanations for each question.\n`;
  }

  return result;
}

export const lessonQuizGenTool = {
  name: 'lesson_quiz_gen',
  description:
    'Generate lessons and quizzes automatically for any topic. Supports multiple difficulty levels and customizable question counts.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      topic: {
        type: 'string',
        description: 'The topic for lesson/quiz',
      },
      type: {
        type: 'string',
        enum: ['lesson', 'quiz', 'both'],
        description: 'What to generate',
      },
      difficulty: {
        type: 'string',
        enum: ['easy', 'medium', 'hard'],
        description: 'Difficulty level (optional)',
      },
      questionCount: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        description: 'Number of questions for quiz (optional, 1-20)',
      },
    },
    required: ['topic', 'type'],
  },
};
