const { genAI } = require('./client');

/**
 * Generate daily tasks for one or more free-text goals for "today".
 * Returns { plans: [ { goal: string, dailyTasks: string[] } ] }
 */
async function generateDailyTasksForGoals(goals) {
  const list = Array.isArray(goals) ? goals.filter(Boolean) : [goals].filter(Boolean);
  if (list.length === 0) throw new Error('No goals provided');

  const prompt = `You are an AI assistant that creates actionable daily tasks.
Given one or more user goals, produce specific, practical tasks for TODAY only.

Rules:
- For EACH goal, return 3 to 5 concrete, actionable tasks.
- Tasks must be specific and practical (e.g., "Read React docs on hooks for 30 minutes"), not vague.
- Keep each task a short imperative sentence.
- Output strictly in JSON, no extra text.

Return JSON with this exact structure:
{
  "plans": [
    { "goal": "<goal text>", "dailyTasks": ["Task 1", "Task 2", "Task 3"] }
  ]
}

Input goals:
${list.map((g, i) => `${i + 1}. ${g}`).join('\n')}`;

  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    const response = await result.response;
    let text = '';
    try { text = response.text(); }
    catch { text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; }
    let data;
    try { data = JSON.parse(text); }
    catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI did not return valid JSON');
      data = JSON.parse(jsonMatch[0]);
    }
    return data;
  };

  try {
    try {
      console.log('[Gemini] Generating daily tasks for goals (2.0-flash)');
      return await tryModel('gemini-2.0-flash');
    } catch (e) {
      console.warn('[Gemini] 2.0-flash failed, fallback to 2.0-flash:', e?.message || e);
      return await tryModel('gemini-1.5-flash');
    }
  } catch (err) {
    console.error('Error generating daily tasks for goals:', err?.message || err);
    throw new Error('Failed to generate daily tasks for goals');
  }
}

module.exports = { generateDailyTasksForGoals };
