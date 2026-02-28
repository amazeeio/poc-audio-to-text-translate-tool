import { transcribeAudioWithOllama } from './localOllamaService';

export const transcribeAudio = async (
  file: File,
  sourceLanguage: string,
  model: string = 'voxtral-mini',
  responseFormat: string = 'json'
): Promise<string> => {
  if (process.env.GATSBY_USE_LOCAL_OLLAMA === 'true') {
    console.log('Using local Ollama fallback for transcription');
    return transcribeAudioWithOllama(file, 'karanchopda333/whisper');
  }

  const apiKey = process.env.GATSBY_LITELLM_API_KEY;
  if (!apiKey) {
    throw new Error('GATSBY_LITELLM_API_KEY is not defined in environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);
  formData.append('response_format', responseFormat);

  // Note: LiteLLM's whispers API typically doesn't strictly adhere to ISO code as input for all
  // providers, but we can pass `language` if the underlying API supports it.
  if (sourceLanguage) {
    formData.append('language', sourceLanguage);
  }

  // Use relative URL to leverage Gatsby development proxy and bypass CORS
  // Note: the path MUST start with /v1 to match the proxy prefix in gatsby-config.js
  const response = await fetch('/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LiteLLM Transcription Error:', errorText);

    // Attempt to extract a clean message if it's JSON, otherwise display the whole string
    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
      }
    } catch (e) {
      // Ignore parse errors, just fallback to raw text
    }

    throw new Error(`Status ${response.status}: ${errorMessage}`);
  }

  const rawText = await response.text();

  // Try parsing as JSON to format it cleanly if it's json/verbose_json
  try {
    const data = JSON.parse(rawText);
    // Return full JSON so the user can see structure like usage etc.
    return JSON.stringify(data, null, 2);
  } catch (err) {
    // If it's vtt, srt, or plain text, return exactly what we got
    return rawText;
  }
};

