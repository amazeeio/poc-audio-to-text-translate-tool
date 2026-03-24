import React, { useState } from 'react';
import type { HeadFC } from 'gatsby';

import { FileUpload } from '../components/FileUpload';
import { LanguageSelector } from '../components/LanguageSelector';
import { TranslationResult } from '../components/TranslationResult';
import { transcribeAudio } from '../services/llmService';
import { translateText, formatTextAsSubtitles } from '../services/translateService';

const languageOptions = [
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'zh', name: 'Chinese (中文)' },
];

const IndexPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState<string>('ru');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [transcribeModel, setTranscribeModel] = useState<string>('gpt-4o-transcribe');
  const [chatModel, setChatModel] = useState<string>('chat');
  const [responseFormat, setResponseFormat] = useState<string>('json');
  const [diarize, setDiarize] = useState<boolean>(false);
  const [timestampGranularity, setTimestampGranularity] = useState<('segment' | 'word')[]>(['segment']);

  const [transcription, setTranscription] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastCurlRequest, setLastCurlRequest] = useState<string>('');

  const handleProcess = async () => {
    if (!file) {
      setError('Please select an audio file first.');
      return;
    }
    if (!sourceLang || !targetLang) {
      setError('Please select both source and target languages.');
      return;
    }

    setError('');
    setTranscription('');
    setTranslation('');

    // Construct a representation of the curl request for transparency
    const curlCommand = `curl -X POST "https://llm.us104.amazee.ai/v1/audio/transcriptions" \\
  -H "Authorization: Bearer [GATSBY_LITELLM_API_KEY]" \\
  -F "file=@${file.name}" \\
  -F "model=${transcribeModel}" \\
  -F "response_format=${responseFormat === 'srt' || responseFormat === 'vtt' ? 'verbose_json' : responseFormat}" \\
  -F "diarize=${diarize}" \\
  ${timestampGranularity.map(g => `-F "timestamp_granularities[]=${g}"`).join(' \\\n  ')} \\
  ${sourceLang ? `-F "language=${sourceLang}"` : ''}`;
    
    setLastCurlRequest(curlCommand);

    try {
      // Step 1: Transcribe Audio
      setIsTranscribing(true);
      let transcribedText = await transcribeAudio(file, sourceLang, transcribeModel, responseFormat, diarize, timestampGranularity);

      // Step 1.1: If srt/vtt was requested but the model returned plain text,
      // use the chat model to "format" it into SRT/VTT for consistency.
      if ((responseFormat === 'srt' || responseFormat === 'vtt') && !transcribedText.includes('-->')) {
        transcribedText = await formatTextAsSubtitles(transcribedText, responseFormat, chatModel);
      }

      setTranscription(transcribedText);
      setIsTranscribing(false);

      // Step 2: Translate Text
      setIsTranslating(true);
      const translatedText = await translateText(transcribedText, targetLang, chatModel, responseFormat);
      setTranslation(translatedText);
      setIsTranslating(false);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during processing.');
      setIsTranscribing(false);
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[96rem] mx-auto flex flex-col">
        <div className="text-center mb-10 w-full">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl !mb-2">
            Audio to Text Translation Tool
          </h1>
          <p className="mt-2 text-xl text-gray-500">
            Upload audio files, transcribe them with an LLM, and translate to your target language.
          </p>
        </div>

        {lastCurlRequest && (
          <div className="mb-6 w-full animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Last Request (cURL)
              </span>
              <button 
                onClick={() => setLastCurlRequest('')}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Clear
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 shadow-inner overflow-x-auto border border-gray-700">
              <pre className="text-[11px] font-mono text-green-400 leading-relaxed whitespace-pre">
                {lastCurlRequest}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">Processing Error</h3>
                <div className="mt-1 text-sm text-red-700 break-words">
                  {error}
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError('')}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Left Column: Form Controls */}
          <div className="w-full lg:w-1/3 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 flex-shrink-0">

          <div className="space-y-6">
            <FileUpload onFileSelect={(f) => setFile(f)} />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <LanguageSelector
                id="source-language"
                label="Source Language"
                value={sourceLang}
                onChange={setSourceLang}
                options={languageOptions}
              />
              <LanguageSelector
                id="target-language"
                label="Target Language in Text"
                value={targetLang}
                onChange={setTargetLang}
                options={languageOptions}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label htmlFor="transcribe-model" className="block text-sm font-medium text-gray-700 mb-1">
                  Transcribe Model
                </label>
                <select
                  id="transcribe-model"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900"
                  value={transcribeModel}
                  onChange={(e) => setTranscribeModel(e.target.value)}
                >
                  <option value="gpt-4o-transcribe">gpt-4o-transcribe</option>
                  <option value="voxtral-mini-2602">voxtral-mini-2602</option>
                  <option disabled value="voxtral-small">voxtral-small [Not Available]</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="chat-model" className="block text-sm font-medium text-gray-700 mb-1">
                  Chat Model
                </label>
                <select
                  id="chat-model"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900"
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value)}
                >
                  <option value="chat">chat</option>
                  <option value="claude-4-5-sonnet">claude-4-5-sonnet</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="response-format" className="block text-sm font-medium text-gray-700 mb-1">
                  Response Format
                </label>
                <select
                  id="response-format"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900"
                  value={responseFormat}
                  onChange={(e) => setResponseFormat(e.target.value)}
                >
                  <option value="json">json</option>
                  <option value="text">text</option>
                  <option value="srt">srt</option>
                  <option value="verbose_json">verbose_json</option>
                  <option value="vtt">vtt</option>
                </select>
                {transcribeModel === 'gpt-4o-transcribe' && ['srt', 'vtt', 'verbose_json'].includes(responseFormat) && (
                  <p
                    className="mt-4 text-xs text-amber-900 bg-amber-100 p-3 rounded-md border border-amber-200 shadow-sm leading-relaxed"
                    style={{ marginTop: '1.5rem' }}
                  >
                    <span className="font-bold flex items-center gap-1 mb-1">
                      <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Compatibility Note
                    </span>
                    The "{responseFormat}" format may not be fully supported by <strong>{transcribeModel}</strong>. If transcription fails or returns unexpected results, please try "json" or "text" instead.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2 border-t border-gray-100 mt-2">
              <div className="flex items-center h-10 mt-4">
                <div className="flex items-center h-5">
                  <input
                    id="diarize"
                    name="diarize"
                    type="checkbox"
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                    checked={diarize}
                    onChange={(e) => setDiarize(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="diarize" className="font-medium text-gray-700 cursor-pointer">
                    Speaker Diarization
                  </label>
                  <p className="text-gray-500 text-xs">Identify different speakers</p>
                </div>
              </div>

              <div className="flex flex-col">
                <label htmlFor="timestamp-granularity" className="block text-sm font-medium text-gray-700 mb-1">
                  Timestamp Granularity
                </label>
                <select
                  id="timestamp-granularity"
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none sm:text-sm rounded-md border ${
                    diarize && timestampGranularity.includes('word')
                      ? 'border-amber-500 ring-1 ring-amber-500'
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } text-gray-900`}
                  value={timestampGranularity.length === 2 ? 'both' : timestampGranularity[0]}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'both') setTimestampGranularity(['segment', 'word']);
                    else setTimestampGranularity([val as 'segment' | 'word']);
                  }}
                >
                  <option value="segment">Segment level</option>
                  <option value="word">Word level</option>
                  <option value="both">Both (Segment & Word)</option>
                </select>
                {diarize && timestampGranularity.includes('word') && (
                  <p className="mt-4 text-xs text-amber-900 bg-amber-100 p-3 rounded-md border border-amber-200 shadow-sm leading-relaxed" style={{ marginTop: '1.5rem' }}>
                    <strong>Note:</strong> When <b>Speaker Diarization</b> is enabled, the model requires <b>Segment level</b> granularity. Please switch to "Segment level" to avoid errors.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleProcess}
                disabled={isTranscribing || isTranslating}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-all duration-200 ${
                  isTranscribing || isTranslating
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:-translate-y-0.5'
                }`}
              >
                {isTranscribing || isTranslating ? 'Processing...' : 'Process Audio'}
              </button>
            </div>
          </div>
          </div>

          {/* Right Column: Results */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <TranslationResult
              transcription={transcription}
              translation={translation}
              isTranscribing={isTranscribing}
              isTranslating={isTranslating}
              transcribeModel={transcribeModel}
              translateModel={chatModel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;

export const Head: HeadFC = () => <title>Audio Translator</title>;
