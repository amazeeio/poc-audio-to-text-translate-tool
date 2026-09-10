import React from 'react';
import type { SonioxOptions } from '../services/soniox';

interface Props {
  options: SonioxOptions;
  onChange: (options: SonioxOptions) => void;
  sourceLang: string;
  targetLang: string;
}

const inputClass =
  'mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500';

const Field: React.FC<{ id: string; label: string; hint: string; children: React.ReactNode }> = ({ id, label, hint, children }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
    <p className="mt-1 text-xs text-gray-500">{hint}</p>
  </div>
);

const Toggle: React.FC<{ id: string; label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ id, label, checked, onChange }) => (
  <label htmlFor={id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
    <input
      id={id}
      type="checkbox"
      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    {label}
  </label>
);

export const SonioxOptionsPanel: React.FC<Props> = ({ options, onChange, sourceLang, targetLang }) => {
  const set = <K extends keyof SonioxOptions>(key: K, value: SonioxOptions[K]) => onChange({ ...options, [key]: value });

  return (
    <fieldset className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-4 space-y-4" data-testid="soniox-options">
      <legend className="px-2 text-sm font-semibold text-indigo-800">Soniox options</legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="soniox-language-hints" label="Language hints" hint="Comma-separated ISO codes, e.g. en, es">
          <input
            id="soniox-language-hints"
            className={inputClass}
            placeholder={sourceLang}
            value={options.languageHints}
            onChange={(e) => set('languageHints', e.target.value)}
          />
        </Field>
        <div className="flex flex-col gap-2 justify-end pb-5">
          <Toggle id="soniox-strict" label="Strict language hints" checked={options.languageHintsStrict} onChange={(v) => set('languageHintsStrict', v)} />
          <Toggle id="soniox-langid" label="Language identification" checked={options.languageIdentification} onChange={(v) => set('languageIdentification', v)} />
          <Toggle id="soniox-diarize" label="Speaker diarization (Soniox)" checked={options.speakerDiarization} onChange={(v) => set('speakerDiarization', v)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="soniox-context-general" label="Context: general" hint="One key: value per line, e.g. domain: Healthcare">
          <textarea id="soniox-context-general" className={inputClass} rows={3} value={options.contextGeneral} onChange={(e) => set('contextGeneral', e.target.value)} />
        </Field>
        <Field id="soniox-context-text" label="Context: text" hint="Free-form background text, glossary or script">
          <textarea id="soniox-context-text" className={inputClass} rows={3} value={options.contextText} onChange={(e) => set('contextText', e.target.value)} />
        </Field>
        <Field id="soniox-context-terms" label="Context: terms" hint="Comma-separated domain terms, e.g. Celebrex, Zyrtec">
          <input id="soniox-context-terms" className={inputClass} value={options.contextTerms} onChange={(e) => set('contextTerms', e.target.value)} />
        </Field>
        <Field id="soniox-context-translation-terms" label="Context: translation terms" hint="One source => target per line">
          <textarea id="soniox-context-translation-terms" className={inputClass} rows={3} value={options.contextTranslationTerms} onChange={(e) => set('contextTranslationTerms', e.target.value)} />
        </Field>
      </div>

      <Toggle
        id="soniox-translate"
        label={`Translate inside Soniox to "${targetLang}" (one_way)`}
        checked={options.translateTo !== ''}
        onChange={(v) => set('translateTo', v ? targetLang : '')}
      />
    </fieldset>
  );
};
