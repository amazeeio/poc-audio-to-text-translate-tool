export const translateTextWithOllama = async (
  text: string,
  targetLanguage: string,
  model: string = 'chat',
  responseFormat: string = 'json'
): Promise<string> => {
  let prompt = `Translate the following text into ${targetLanguage}:\n\n${text}`;

  if (responseFormat === 'srt' || responseFormat === 'vtt') {
    prompt = `Translate the following ${responseFormat.toUpperCase()} file into ${targetLanguage}.
    Preserve all timestamps and the ${responseFormat.toUpperCase()} structure exactly.
    Only translate the actual spoken text content.\n\n${text}`;
  }

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
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
  model: string = 'chat',
  responseFormat: string = 'json'
): Promise<string> => {
  if (process.env.GATSBY_USE_LOCAL_OLLAMA === 'true') {
    console.log('Using local Ollama fallback for translation');
    return translateTextWithOllama(text, targetLanguage, 'chat', responseFormat);
  }

  const apiKey = process.env.GATSBY_LITELLM_API_KEY;
  if (!apiKey) {
    throw new Error('GATSBY_LITELLM_API_KEY is not defined in environment variables.');
  }

  let systemPrompt = `You are a professional translator. Translate the text provided by the user into ${targetLanguage}. Provide only the translation without any additional commentary.`;

  if (responseFormat === 'srt' || responseFormat === 'vtt') {
    systemPrompt = `You are a professional translator specializing in subtitle files.
    Translate the ${responseFormat.toUpperCase()} content provided by the user into ${targetLanguage}.
    CRITICAL: You MUST preserve all timestamps, sequence numbers, and ${responseFormat.toUpperCase()} structure exactly as they are.
    Only translate the actual spoken text content.
    Provide only the translated ${responseFormat.toUpperCase()} content without any additional commentary.`;
  }

  // Use relative URL to leverage Gatsby proxy for POST to /v1/chat/completions
  const body: any = {
    model: model,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: text
      }
    ]
  };

  // Note: We don't send response_format=srt/vtt here because chat completions 
  // APIs generally don't support these as structured output types.
  // We rely on the system prompt to guide the LLM to produce the correct format.
  if (responseFormat === 'json' || responseFormat === 'verbose_json') {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body),
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

/**
 * If transcription returns plain text but SRT was requested, 
 * this helper uses the LLM to format the plain text into an SRT structure.
 */
export const formatTextAsSubtitles = async (
  text: string,
  responseFormat: string = 'srt',
  model: string = 'chat'
): Promise<string> => {
  if (responseFormat !== 'srt' && responseFormat !== 'vtt') return text;
  if (text.includes('-->')) return text; // Already has timings

  const apiKey = process.env.GATSBY_LITELLM_API_KEY;
  if (!apiKey) return text;

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
          content: `You are a professional subtitle editor. 
          Convert the following plain text transcript into a valid ${responseFormat.toUpperCase()} file.
          Since you don't have exact timings, create reasonable estimated timestamps or a single long segment.
          Provide ONLY the ${responseFormat.toUpperCase()} content without any commentary.`
        },
        {
          role: 'user',
          content: text
        }
      ]
    }),
  });

  if (!response.ok) return text;
  const data = await response.json();
  return data.choices?.[0]?.message?.content || text;
};
