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
  translateTo: string;
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
  translateTo: '',
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

// Form fields as [name, value] pairs, used both for the FormData body and the curl preview.
export const buildSonioxFormFields = (o: SonioxOptions): [string, string][] => {
  const hints = splitList(o.languageHints);
  const context = buildSonioxContext(o);
  return [
    ...hints.map((h): [string, string] => ['language_hints[]', h]),
    ...(o.languageHintsStrict && hints.length ? [['language_hints_strict', 'true'] as [string, string]] : []),
    ...(o.languageIdentification ? [['enable_language_identification', 'true'] as [string, string]] : []),
    ...(o.speakerDiarization ? [['enable_speaker_diarization', 'true'] as [string, string]] : []),
    ...(context ? [['context', JSON.stringify(context)] as [string, string]] : []),
    ...(o.translateTo
      ? [['translation', JSON.stringify({ type: 'one_way', target_language: o.translateTo })] as [string, string]]
      : []),
  ];
};
