import React from 'react';

import { validateSubtitle, SubtitleFormat } from '../services/subtitle';

interface TranslationResultProps {
  transcription: string;
  translation: string;
  isTranscribing: boolean;
  isTranslating: boolean;
  transcribeModel: string;
  translateModel: string;
  responseFormat: string;
}

const downloadText = (text: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const SubtitleTools: React.FC<{ content: string; format: SubtitleFormat; filename: string }> = ({
  content,
  format,
  filename,
}) => {
  const error = validateSubtitle(content, format);
  return (
    <div className="mt-2 flex items-center gap-3 text-xs">
      {error ? (
        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200" title={error}>
          ✗ Invalid {format.toUpperCase()}: {error}
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
          ✓ Valid {format.toUpperCase()}
        </span>
      )}
      <button
        onClick={() => downloadText(content, filename)}
        className="underline text-indigo-600 hover:text-indigo-800 cursor-pointer"
      >
        Download .{format}
      </button>
    </div>
  );
};

export const TranslationResult: React.FC<TranslationResultProps> = ({
  transcription,
  translation,
  isTranscribing,
  isTranslating,
  transcribeModel,
  translateModel,
  responseFormat,
}) => {
  const subtitleFormat =
    responseFormat === 'srt' || responseFormat === 'vtt' ? (responseFormat as SubtitleFormat) : null;

  return (
    <div className="w-full space-y-6 grid grid-cols-2 gap-6">
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
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Transcribed via "{transcribeModel}" model.</p>
          {subtitleFormat && transcription && !isTranscribing && (
            <SubtitleTools
              content={transcription}
              format={subtitleFormat}
              filename={`transcription.${subtitleFormat}`}
            />
          )}
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
          <p className="mt-1 max-w-2xl text-sm text-indigo-500">Target language text result via "{translateModel}" model.</p>
          {subtitleFormat && translation && !isTranslating && (
            <SubtitleTools
              content={translation}
              format={subtitleFormat}
              filename={`translation.${subtitleFormat}`}
            />
          )}
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
