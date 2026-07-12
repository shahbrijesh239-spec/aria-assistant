const { GoogleGenAI } = require('@google/genai');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { messages, system, apiKey } = body;

    if (!apiKey) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: { message: 'API key required' } }) };
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: contents,
      config: {
        systemInstruction: system,
        temperature: 0.8
        // NOTICE: maxOutputTokens has been completely removed!
      }
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini API');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: response.text })
    };

  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: error.message || 'An unexpected error occurred.' } })
    };
  }
};