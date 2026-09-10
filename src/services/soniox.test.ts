import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSonioxFormFields, defaultSonioxOptions } from './soniox.ts';

test('no options yields no fields', () => {
  assert.deepEqual(buildSonioxFormFields(defaultSonioxOptions), []);
});

test('context sections are parsed into the Soniox JSON shape', () => {
  const fields = buildSonioxFormFields({
    ...defaultSonioxOptions,
    contextGeneral: 'domain: Healthcare\nspeaker: Dr. Smith\nbad line without separator',
    contextText: '  Follow-up visit.  ',
    contextTerms: 'Celebrex, Zyrtec,, ',
    contextTranslationTerms: 'Mr. Smith => Sr. Smith\n=> missing source',
  });
  assert.equal(fields.length, 1);
  assert.equal(fields[0][0], 'context');
  assert.deepEqual(JSON.parse(fields[0][1]), {
    general: [{ key: 'domain', value: 'Healthcare' }, { key: 'speaker', value: 'Dr. Smith' }],
    text: 'Follow-up visit.',
    terms: ['Celebrex', 'Zyrtec'],
    translation_terms: [{ source: 'Mr. Smith', target: 'Sr. Smith' }],
  });
});

test('language hints, flags and translation map to their form fields', () => {
  const fields = buildSonioxFormFields({
    ...defaultSonioxOptions,
    languageHints: 'en, es',
    languageHintsStrict: true,
    languageIdentification: true,
    speakerDiarization: true,
    translateTo: 'de',
  });
  assert.deepEqual(fields, [
    ['language_hints[]', 'en'],
    ['language_hints[]', 'es'],
    ['language_hints_strict', 'true'],
    ['enable_language_identification', 'true'],
    ['enable_speaker_diarization', 'true'],
    ['translation', JSON.stringify({ type: 'one_way', target_language: 'de' })],
  ]);
});

test('strict flag is dropped without hints', () => {
  const fields = buildSonioxFormFields({ ...defaultSonioxOptions, languageHintsStrict: true });
  assert.deepEqual(fields, []);
});
