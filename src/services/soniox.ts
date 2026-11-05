// Soniox-specific transcription options, sent as extra multipart form fields on
// /v1/audio/transcriptions. See https://soniox.com/docs/stt/concepts/context
export interface SonioxOptions {
  languageHints: string;
  languageHintsStrict: boolean;
  languageIdentification: boolean;
  speakerDiarization: boolean;
  contextGeneral: string;
  contextText: string;
  contextTerms: string;
  contextTranslationTerms: string;
  translation: '' | 'one_way' | 'two_way';
  pollingInterval: string;
  maxPollingAttempts: string;
}

export const defaultSonioxOptions: SonioxOptions = {
  languageHints: '',
  languageHintsStrict: false,
  languageIdentification: false,
  speakerDiarization: false,
  contextGeneral: '',
  contextText: '',
  contextTerms: '',
  contextTranslationTerms: '',
  translation: '',
  pollingInterval: '',
  maxPollingAttempts: '',
};

export const isSonioxModel = (model: string): boolean => model.startsWith('stt-');

const splitList = (value: string): string[] =>
  value.split(',').map(s => s.trim()).filter(Boolean);

const splitPairs = (value: string, separator: string): [string, string][] =>
  value
    .split('\n')
    .map(line => line.split(separator))
    .filter(parts => parts.length >= 2 && parts[0].trim() && parts.slice(1).join(separator).trim())
    .map(parts => [parts[0].trim(), parts.slice(1).join(separator).trim()]);

export const buildSonioxContext = (o: SonioxOptions): Record<string, unknown> | null => {
  const general = splitPairs(o.contextGeneral, ':').map(([key, value]) => ({ key, value }));
  const terms = splitList(o.contextTerms);
  const translationTerms = splitPairs(o.contextTranslationTerms, '=>').map(([source, target]) => ({ source, target }));
  const text = o.contextText.trim();
  const context = {
    ...(general.length ? { general } : {}),
    ...(text ? { text } : {}),
    ...(terms.length ? { terms } : {}),
    ...(translationTerms.length ? { translation_terms: translationTerms } : {}),
  };
  return Object.keys(context).length ? context : null;
};

// one_way translates everything into `target`; two_way translates between the source and target languages.
const buildTranslation = (o: SonioxOptions, source: string, target: string): Record<string, string> | null => {
  if (o.translation === 'one_way' && target) return { type: 'one_way', target_language: target };
  if (o.translation === 'two_way' && source && target) return { type: 'two_way', language_a: source, language_b: target };
  return null;
};

// Form fields as [name, value] pairs, used both for the FormData body and the curl preview.
// soniox_polling_* are read by the LiteLLM handler (>= 1.108) and are not sent on to Soniox.
export const buildSonioxFormFields = (o: SonioxOptions, source = '', target = ''): [string, string][] => {
  const hints = splitList(o.languageHints);
  const context = buildSonioxContext(o);
  const translation = buildTranslation(o, source, target);
  const pollingInterval = o.pollingInterval.trim();
  const maxPollingAttempts = o.maxPollingAttempts.trim();
  return [
    ...hints.map((h): [string, string] => ['language_hints[]', h]),
    ...(o.languageHintsStrict && hints.length ? [['language_hints_strict', 'true'] as [string, string]] : []),
    ...(o.languageIdentification ? [['enable_language_identification', 'true'] as [string, string]] : []),
    ...(o.speakerDiarization ? [['enable_speaker_diarization', 'true'] as [string, string]] : []),
    ...(context ? [['context', JSON.stringify(context)] as [string, string]] : []),
    ...(translation ? [['translation', JSON.stringify(translation)] as [string, string]] : []),
    ...(pollingInterval ? [['soniox_polling_interval', pollingInterval] as [string, string]] : []),
    ...(maxPollingAttempts ? [['soniox_max_polling_attempts', maxPollingAttempts] as [string, string]] : []),
  ];
};
