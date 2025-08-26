const { genAI } = require('./client');

/**
 * Generate multiple-choice quiz questions (10-20) for a given task/topic.
 * Returns: { title: string, questions: [{ question_text, option_a, option_b, option_c, option_d, correct_option }] }
 */
async function generateQuizQuestions(topic, description = '', count = 12) {
  const safeCount = Math.max(10, Math.min(20, Number(count) || 12));
  const prompt = `You are an expert quiz setter. Create a multiple-choice quiz for the topic below.

TOPIC: ${topic}
CONTEXT: ${description || 'N/A'}

REQUIREMENTS:
- Produce ${safeCount} distinct, clear questions.
- Each question must have exactly 4 options: A, B, C, D.
- Provide the correct option as one of 'A','B','C','D'.
- Difficulty should be mixed (easy/medium) and focused on understanding.

OUTPUT JSON ONLY:
{
  "title": "<short quiz title>",
  "questions": [
    {
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "A|B|C|D"
    }
  ]
}`;

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
    // sanitize
    if (!Array.isArray(data.questions)) throw new Error('Invalid quiz format');
    data.questions = data.questions.slice(0, safeCount).map((q) => ({
      question_text: String(q.question_text || q.text || ''),
      option_a: String(q.option_a || q.a || ''),
      option_b: String(q.option_b || q.b || ''),
      option_c: String(q.option_c || q.c || ''),
      option_d: String(q.option_d || q.d || ''),
      correct_option: String(q.correct_option || q.answer || 'A').replace(/[^ABCD]/i, 'A').toUpperCase(),
    }));
    data.title = String(data.title || `${topic} Quiz`);
    return data;
  };

  try {
    try {
      console.log('[Gemini] Generating quiz (2.0-flash)');
      return await tryModel('gemini-2.0-flash');
    } catch (e) {
      console.warn('[Gemini] 2.0-flash failed, fallback to 1.5-flash:', e?.message || e);
      return await tryModel('gemini-2.0-flash');
    }
  } catch (err) {
    console.error('Error generating quiz with Gemini:', err?.message || err);
    throw new Error('Failed to generate quiz');
  }
}

module.exports = { generateQuizQuestions };
