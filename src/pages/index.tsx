import React, { useState } from 'react';
import type { HeadFC } from 'gatsby';

import { FileUpload } from '../components/FileUpload';
import { LanguageSelector } from '../components/LanguageSelector';
import { TranslationResult } from '../components/TranslationResult';
import { transcribeAudio } from '../services/llmService';
import { translateText } from '../services/translateService';

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

  const [transcription, setTranscription] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string>('');

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

    try {
      // Step 1: Transcribe Audio
      setIsTranscribing(true);
      const transcribedText = await transcribeAudio(file, sourceLang, transcribeModel, responseFormat);
      setTranscription(transcribedText);
      setIsTranscribing(false);

      // Step 2: Translate Text
      setIsTranslating(true);
      const translatedText = await translateText(transcribedText, targetLang, chatModel);
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

        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Left Column: Form Controls */}
          <div className="w-full lg:w-1/3 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 flex-shrink-0">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <FileUpload onFileSelect={(f) => setFile(f)} />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <LanguageSelector
                label="Source Language"
                value={sourceLang}
                onChange={setSourceLang}
                options={languageOptions}
              />
              <LanguageSelector
                label="Target Language in Text"
                value={targetLang}
                onChange={setTargetLang}
                options={languageOptions}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transcribe Model
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900"
                  value={transcribeModel}
                  onChange={(e) => setTranscribeModel(e.target.value)}
                >
                  <option value="gpt-4o-transcribe">gpt-4o-transcribe</option>
                  <option disabled value="voxtral-mini">voxtral-mini [Not Available]</option>
                  <option disabled value="voxtral-small">voxtral-small [Not Available]</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chat Model
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900"
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value)}
                >
                  <option value="chat">chat</option>
                  <option value="claude-4-5-sonnet">claude-4-5-sonnet</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Format
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900"
                  value={responseFormat}
                  onChange={(e) => setResponseFormat(e.target.value)}
                >
                  <option value="json">json</option>
                  <option value="text">text</option>
                  <option disabled value="srt">srt [Not Available]</option>
                  <option disabled value="verbose_json">verbose_json [Not Available]</option>
                  <option disabled value="vtt">vtt [Not Available]</option>
                </select>
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
