const { genAI } = require('./client');

/**
 * Generate daily plans for the full goal timeline in one response.
 * Returns JSON with the shape:
 * { goal_id: string, dailyPlans: [{ date: 'YYYY-MM-DD', tasks: [{ task_title, description, duration, resource, status }] }] }
 */
async function generateFullTimelinePlans(goal, userPreferences = {}) {
  const dateToISO = (d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const prefs = userPreferences || {};
  const start = new Date(goal.start_date);
  const end = new Date(goal.end_date);
  const startISO = dateToISO(start);
  const endISO = dateToISO(end);

  const prompt = `You are an AI study planner generator inside a full-stack web app.
Whenever a new study goal is created, generate a daily plan for the full timeline.

Input details (from backend):
- goal_id: ${goal.goal_id}
- goal_title: ${goal.title}
- subject: ${goal.description || 'General Study'}
- difficulty: ${goal.difficulty_level}
- timeline_start: ${startISO}
- timeline_end: ${endISO}
- extra_notes: ${prefs.extra_notes || 'N/A'}

Your task:
1. Break this goal into daily study plans covering every date from timeline_start to timeline_end.
2. Each daily plan must be associated with the correct goal_id.
3. For each day, create one or more tasks with:
   - task_title
   - description (what to do that day)
   - duration (minutes)
   - resource (book, lecture, exercise, quiz, etc.)
   - status: "pending"
4. Output strictly in JSON format, so the backend can save it into DailyPlans and Tasks.

Expected JSON structure:
{
  "goal_id": "${goal.goal_id}",
  "dailyPlans": [
    {
      "date": "${startISO}",
      "tasks": [
        {
          "task_title": "Topic or activity",
          "description": "What to do",
          "duration": 60,
          "resource": "Textbook | Video Lecture | Practice | Quiz | Article",
          "status": "pending"
        }
      ]
    }
  ]
}

Rules:
- Always cover the full range of days in the timeline.
- If difficulty is "easy", spread topics evenly with lighter workload.
- If "medium", balance between theory and practice daily.
- If "hard", pack more hours and harder topics earlier in the timeline.
- Keep tasks realistic (30–120 minutes each).
- Never skip a day unless explicitly requested.

Return only the JSON response.`;

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
      console.log('[Gemini] Generating full timeline with gemini-2.0-flash');
      return await tryModel('gemini-2.0-flash');
    } catch (e) {
      console.warn('[Gemini] 2.0-flash failed, fallback to 1.5-flash:', e?.message || e);
      return await tryModel('gemini-1.5-flash');
    }
  } catch (err) {
    console.error('Error generating full timeline plan with Gemini AI:', err?.message || err);
    throw new Error('Failed to generate full timeline plan');
  }
}

module.exports = { generateFullTimelinePlans };
