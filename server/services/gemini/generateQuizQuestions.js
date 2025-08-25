const { genAI } = require('./client');

async function generateQuizQuestions(topic, description = '', count = 12) {
  const safeCount = Math.max(10, Math.min(20, Number(count) || 12));
  const prompt = `You are an expert quiz setter...`;

  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } });
    const response = await result.response;
    let text = '';
    try { text = response.text(); } catch { text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; }
    let data;
    try { data = JSON.parse(text); }
    catch { const m = text.match(/\{[\s\S]*\}/); if (!m) throw new Error('AI did not return valid JSON'); data = JSON.parse(m[0]); }
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
    try { return await tryModel('gemini-2.0-flash'); }
    catch { return await tryModel('gemini-1.5-flash'); }
  } catch (e) {
    console.error('generateQuizQuestions error:', e?.message || e);
    throw new Error('Failed to generate quiz');
  }
}

module.exports = { generateQuizQuestions };
