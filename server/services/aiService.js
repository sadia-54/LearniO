import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateDailyPlan(goalTitle, difficulty, startDate, endDate) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const prompt = `
You are an AI study planner. 
Create daily study or practice tasks for the goal "${goalTitle}" from ${startDate} to ${endDate}. 
Tasks should include type (reading, video, quiz, custom), title, description, estimated_duration in minutes. 
Use JSON array format like:
[
  {"type": "reading", "title": "...", "description": "...", "estimated_duration": 60},
  ...
]
`;

  const response = await model.generateContent(prompt);
  const plan = JSON.parse(response.response.text());
  return plan;
}
