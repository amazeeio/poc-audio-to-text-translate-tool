import { transcribeAudioWithOllama } from './localOllamaService';

const formatTime = (seconds: number, type: 'srt' | 'vtt'): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  const hDisplay = h.toString().padStart(2, '0');
  const mDisplay = m.toString().padStart(2, '0');
  const sDisplay = s.toString().padStart(2, '0');
  const msDisplay = ms.toString().padStart(3, '0');
  
  if (type === 'srt') {
    return `${hDisplay}:${mDisplay}:${sDisplay},${msDisplay}`;
  }
  return `${hDisplay}:${mDisplay}:${sDisplay}.${msDisplay}`;
};

const segmentsToSRT = (segments: any[]): string => {
  return segments.map((seg, i) => {
    return `${i + 1}\n${formatTime(seg.start, 'srt')} --> ${formatTime(seg.end, 'srt')}\n${seg.text.trim()}\n`;
  }).join('\n');
};

const segmentsToVTT = (segments: any[]): string => {
  return 'WEBVTT\n\n' + segments.map((seg) => {
    return `${formatTime(seg.start, 'vtt')} --> ${formatTime(seg.end, 'vtt')}\n${seg.text.trim()}\n`;
  }).join('\n');
};

export const transcribeAudio = async (
  file: File,
  sourceLanguage: string,
  model: string = 'gpt-4o-transcribe',
  responseFormat: string = 'json',
  diarize: boolean = false,
  timestampGranularities: ('segment' | 'word')[] = ['segment']
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
  
  // diarize and timestamp_granularities support
  formData.append('diarize', diarize.toString());
  timestampGranularities.forEach(g => formData.append('timestamp_granularities[]', g));
  
  formData.append('response_format', responseFormat);

  if (sourceLanguage) {
    formData.append('language', sourceLanguage);
  }

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

    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
      }
    } catch (e) {}

    throw new Error(`Status ${response.status}: ${errorMessage}`);
  }

  const rawText = await response.text();

  // If the user requested a non-JSON format, return the raw text directly.
  // This avoids "fake" SRT/VTT generation and lets the user see if the API 
  // actually honored the response_format=srt/vtt request.
  if (responseFormat === 'srt' || responseFormat === 'vtt' || responseFormat === 'text') {
    return rawText;
  }

  try {
    const data = JSON.parse(rawText);
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return rawText;
  }
};
