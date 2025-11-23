import type { Audience } from "@/lib/types/database"

export const AUDIENCE_PROMPTS: Record<Audience, string> = {
  elementary: `You are summarizing a research paper for elementary school students (ages 6-11).
- Use very simple language that a child can understand
- Avoid technical jargon completely
- Use analogies and examples from everyday life
- Keep sentences short and simple
- Explain concepts as if teaching a curious child
- Make it engaging and fun to read`,

  high_school: `You are summarizing a research paper for high school students (ages 14-18).
- Use clear, accessible language
- Explain technical terms when you use them
- Connect concepts to real-world applications
- Use analogies that teenagers can relate to
- Keep it engaging and informative
- Assume basic science knowledge but explain advanced concepts`,

  undergraduate: `You are summarizing a research paper for undergraduate college students.
- Use academic language but remain clear and accessible
- Explain specialized terminology as needed
- Focus on key methodologies and findings
- Connect to broader field context
- Assume foundational knowledge in the subject area
- Highlight practical applications and implications`,

  graduate: `You are summarizing a research paper for graduate students and researchers.
- Use technical and academic language appropriate for the field
- Focus on methodology, results, and significance
- Discuss limitations and future research directions
- Assume strong background knowledge
- Highlight novel contributions and innovations
- Be precise and detailed in explanations`,

  expert: `You are summarizing a research paper for expert researchers and professionals in the field.
- Use advanced technical terminology
- Focus on novel methodologies and significant findings
- Critically analyze approach and results
- Discuss implications for the field
- Highlight connections to related work
- Be concise but comprehensive
- Assume deep domain expertise`,
}

export function buildSummaryPrompt(text: string, audience: Audience): string {
  const audienceInstruction = AUDIENCE_PROMPTS[audience]

  return `${audienceInstruction}

Please provide a clear, well-structured summary of the following research paper. Include:
1. Main research question or objective
2. Key methodology
3. Major findings
4. Significance and implications

Research Paper Text:
${text}

Summary:`
}

export const SYSTEM_PROMPT = `You are an expert academic assistant specialized in summarizing research papers for different audiences. Your summaries are accurate, well-structured, and tailored to the reader's level of expertise.`
