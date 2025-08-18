const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a study plan for a specific date for the given goal.
 * @param {Object} goal Prisma StudyGoals
 * @param {Object} userPreferences Prisma Settings or partial settings
 * @param {Date|string} [targetDate] The calendar date to generate a plan for (defaults to today). ISO string or Date.
 */
async function generateDailyPlan(goal, userPreferences = {}, targetDate) {
  try {
    const dateObj = targetDate ? new Date(targetDate) : new Date();
    // Enforce YYYY-MM-DD format
    const yyyy = dateObj.getUTCFullYear();
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getUTCDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;

  // Ensure preferences object is safe even if null was passed
  const prefs = userPreferences || {};

    const prompt = `
You are an expert study planner and educational consultant. Generate a personalized daily study plan for a student based on their goal.

STUDENT GOAL:
- Title: ${goal.title}
- Description: ${goal.description || 'No description provided'}
- Difficulty Level: ${goal.difficulty_level}
- Start Date: ${new Date(goal.start_date).toLocaleDateString()}
- End Date: ${new Date(goal.end_date).toLocaleDateString()}

USER PREFERENCES:
- Preferred study hours per day: ${prefs.daily_study_hours || 2}
- Study blocks: ${prefs.preferred_time_blocks ? JSON.stringify(prefs.preferred_time_blocks) : 'Morning (9 AM - 12 PM), Afternoon (1 PM - 5 PM)'}

REQUIREMENTS:
1. Generate a realistic daily study plan for the SPECIFIC DATE: ${isoDate}. The "date" field MUST be exactly "${isoDate}".
2. Break down the goal into 2-4 manageable tasks
3. Each task should have:
   - A clear, specific title
   - Detailed description of what to do
   - Estimated duration (15-120 minutes)
   - Task type (reading, video, quiz, or custom)
   - Resource suggestions if applicable
4. Organize tasks into logical time blocks
5. Consider the difficulty level and adjust task complexity accordingly
6. Make tasks actionable and measurable

OUTPUT FORMAT (return only valid JSON):
{
  "date": "${isoDate}",
  "timeBlocks": [
    {
      "name": "Morning Focus (9:00 AM - 12:00 PM)",
      "tasks": [
        {
          "title": "Task Title",
          "description": "Detailed description of what to do",
          "type": "reading|video|quiz|custom",
          "estimated_duration": 60,
          "resource_url": "optional resource link",
          "time_slot": "9:00 AM - 10:00 AM"
        }
      ]
    }
  ]
}

Generate a plan that is challenging but achievable, with clear progression toward the goal.
`;
    // Helper to try a specific model and parse the response into JSON
    const tryModel = async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
      const response = await result.response;
      let text = '';
      try {
        text = response.text();
      } catch (_) {
        // Some SDK versions expose candidates/parts
        text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      }

      // Prefer direct JSON parse; fallback to regex extraction
      let planData;
      try {
        planData = JSON.parse(text);
      } catch (_) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('AI did not return valid JSON');
        }
        planData = JSON.parse(jsonMatch[0]);
      }
      // Defensive: ensure date is the requested isoDate
      planData.date = isoDate;
      return planData;
    };

    // Try gemini-2.0-flash first, fall back to 1.5 if needed
    try {
      console.log('[Gemini] Using model gemini-2.0-flash');
      return await tryModel('gemini-2.0-flash');
    } catch (primaryErr) {
      console.warn('[Gemini] gemini-2.0-flash failed, falling back to gemini-1.5-flash:', primaryErr?.message || primaryErr);
      return await tryModel('gemini-1.5-flash');
    }
  } catch (error) {
    console.error('Error generating daily plan with Gemini AI:', error?.message || error);
    throw new Error('Failed to generate daily plan');
  }
}

module.exports = { generateDailyPlan };

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

module.exports.generateFullTimelinePlans = generateFullTimelinePlans;

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
      console.warn('[Gemini] 2.0-flash failed, fallback to 1.5-flash:', e?.message || e);
      return await tryModel('gemini-1.5-flash');
    }
  } catch (err) {
    console.error('Error generating daily tasks for goals:', err?.message || err);
    throw new Error('Failed to generate daily tasks for goals');
  }
}

module.exports.generateDailyTasksForGoals = generateDailyTasksForGoals;
