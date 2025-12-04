import { GoogleGenAI } from "@google/genai";
import { Survey, SurveyResponse, QuestionType } from '../types';

// NOTE: In a real production app, you should proxy this through a backend.
// For this demo, we assume the environment variable is set or passed.
const apiKey = process.env.API_KEY || ''; 

export const generateThesisAnalysis = async (survey: Survey, responses: SurveyResponse[]): Promise<string> => {
  if (!apiKey) {
    return "لطفاً کلید API را تنظیم کنید تا تحلیل هوشمند فعال شود.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare data summary for the prompt
  let dataSummary = `Survey Title: ${survey.title}\nDescription: ${survey.description}\nTotal Participants: ${responses.length}\n\nData by Question:\n`;

  survey.questions.forEach((q, index) => {
    dataSummary += `\nQ${index + 1} (${q.type}): ${q.title}\n`;

    if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
      const counts: Record<string, number> = {};
      q.options.forEach((opt, i) => counts[i] = 0);
      responses.forEach(r => {
        const ans = r.answers.find(a => a.questionId === q.id);
        if (ans && ans.choiceIndex !== undefined) {
          counts[ans.choiceIndex] = (counts[ans.choiceIndex] || 0) + 1;
        }
      });
      
      q.options.forEach((opt, i) => {
        dataSummary += `  - ${opt}: ${counts[i]} votes\n`;
      });
    } else if (q.type === QuestionType.TEXT) {
      // Pick a few random text samples to keep prompt size manageable
      const samples = responses
        .map(r => r.answers.find(a => a.questionId === q.id)?.textAnswer)
        .filter(t => t)
        .slice(0, 10);
      dataSummary += `  - Samples: ${JSON.stringify(samples)}\n`;
    } else if (q.type === QuestionType.HEATMAP) {
        dataSummary += `  - Heatmap data collected (Coordinates processed visually, assume 2 main clusters based on distribution).\n`;
    }
  });

  const prompt = `
    You are a senior academic data analyst assisting a student with their Master's Thesis.
    Based on the survey data below, write a comprehensive, professional, and academic analysis in Persian (Farsi).
    
    Structure the response as follows:
    1. **مقدمه (Introduction)**: Brief overview of the data quantity.
    2. **تحلیل آماری (Statistical Analysis)**: Analyze the multiple-choice questions. Identify trends.
    3. **تحلیل محتوایی (Content Analysis)**: Summarize the qualitative text responses.
    4. **تحلیل فضایی (Spatial Analysis)**: Interpret the heatmap data (assume there are clusters of interest). Explain what high concentration areas might mean in the context of the question.
    5. **نتیجه‌گیری نهایی (Conclusion)**: A strong concluding paragraph suitable for the final chapter of a thesis.

    Use Markdown formatting. Use professional academic Persian vocabulary.

    Data:
    ${dataSummary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "خطا در تولید تحلیل.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "متاسفانه خطایی در ارتباط با هوش مصنوعی رخ داد. لطفاً مجدداً تلاش کنید.";
  }
};
