export const translateTextWithOllama = async (
  text: string,
  targetLanguage: string,
  model: string = 'karanchopda333/whisper'
): Promise<string> => {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: `Translate the following text into ${targetLanguage}:\n\n${text}`,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ollama Translation Error:', errorText);
    throw new Error(`Ollama Error Status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.response || '';
};

export const translateText = async (
  text: string,
  targetLanguage: string,
  model: string = 'chat'
): Promise<string> => {
  if (process.env.GATSBY_USE_LOCAL_OLLAMA === 'true') {
    console.log('Using local Ollama fallback for translation');
    return translateTextWithOllama(text, targetLanguage, 'karanchopda333/whisper');
  }

  const apiKey = process.env.GATSBY_LITELLM_API_KEY;
  if (!apiKey) {
    throw new Error('GATSBY_LITELLM_API_KEY is not defined in environment variables.');
  }

  // Use relative URL to leverage Gatsby proxy for POST to /v1/chat/completions
  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the text provided by the user into ${targetLanguage}. Provide only the translation without any additional commentary.`
        },
        {
          role: 'user',
          content: text
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LiteLLM Translation Error:', errorText);

    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
      }
    } catch (e) {
      // fallback
    }

    throw new Error(`Status ${response.status}: ${errorMessage}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};
