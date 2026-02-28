import React from 'react';

interface TranslationResultProps {
  transcription: string;
  translation: string;
  isTranscribing: boolean;
  isTranslating: boolean;
}

export const TranslationResult: React.FC<TranslationResultProps> = ({
  transcription,
  translation,
  isTranscribing,
  isTranslating,
}) => {

  return (
    <div className="w-full space-y-6">
      {/* Transcription Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
            <span>Audio Transcription</span>
            {isTranscribing && (
              <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Transcribed via Voxtral LLM.</p>
        </div>
        <div className="px-4 py-5 sm:p-6 text-gray-800 whitespace-pre-wrap min-h-[100px]">
          {isTranscribing ? (
            <div className="flex justify-center items-center h-full text-gray-400 italic">Processing audio...</div>
          ) : (
            transcription
          )}
          {!transcription && !isTranscribing && !translation && !isTranslating && (
            <div className="flex justify-center items-center h-full text-gray-400 italic">No transcription yet</div>
          )}
        </div>
      </div>

      {/* Translation Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6 bg-indigo-50 border-b border-indigo-100">
          <h3 className="text-lg leading-6 font-medium text-indigo-900 flex items-center gap-2">
            <span>Translated Text</span>
            {isTranslating && (
              <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-indigo-500">Target language text result.</p>
        </div>
        <div className="px-4 py-5 sm:p-6 text-gray-800 whitespace-pre-wrap min-h-[100px]">
          {isTranslating ? (
            <div className="flex justify-center items-center h-full text-gray-400 italic">Translating...</div>
          ) : transcription && !translation ? (
            <div className="flex justify-center items-center h-full text-gray-400 italic">Waiting...</div>
          ) : (
            translation
          )}
          {!translation && !isTranslating && !transcription && !isTranscribing && (
            <div className="flex justify-center items-center h-full text-gray-400 italic">No translation yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
