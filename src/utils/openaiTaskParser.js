export async function parseTasksWithAI(input, currentDate) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found in .env file');
  }

  const dateStr = currentDate instanceof Date 
    ? currentDate.toISOString().split('T')[0] 
    : String(currentDate);

  const prompt = `Parse these task descriptions into structured calendar tasks. Current date: ${dateStr}

Format minutes to closest solid hours or half-hours only. Floor Start times and Ceil End times. Only 00 or 30 minutes allowed. If no specific time is mentioned, use reasonable defaults (e.g., 9:00-10:00). Use the default color #e3f2fd unless specified otherwise.

Return ONLY a JSON array with this structure:
[
  {
    "title": "Task title",
    "description": "Task description",
    "date": "YYYY-MM-DD",
    "from_time": "HH:mm",
    "to_time": "HH:mm",
    "color": "#e3f2fd"
  }
]

Task descriptions:
${input}

Guidelines:
- Extract task titles, descriptions, dates, and times from the descriptions
- Use 24-hour time format (HH:mm)
- If no specific date is mentioned, use the current date or reasonable defaults
- If no specific time is mentioned, use reasonable defaults (e.g., 9:00-10:00)
- Use the default color #e3f2fd unless specified otherwise`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful calendar assistant. Always return valid JSON arrays.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response');
  }

  return JSON.parse(jsonMatch[0]);
}
