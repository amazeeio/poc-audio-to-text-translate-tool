import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSubtitle } from './subtitle.ts';

const srt = `1
00:00:01,000 --> 00:00:03,500
Hello world

2
00:00:04,000 --> 00:00:06,000
Second line`;

const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.500
Hello world

00:00:04.000 --> 00:00:06.000
Second line`;

test('valid srt passes', () => assert.equal(validateSubtitle(srt, 'srt'), null));
test('valid vtt passes', () => assert.equal(validateSubtitle(vtt, 'vtt'), null));
test('empty output fails', () => assert.match(validateSubtitle('  ', 'srt')!, /empty/));
test('vtt without header fails', () =>
  assert.match(validateSubtitle(vtt.replace('WEBVTT\n\n', ''), 'vtt')!, /WEBVTT/));
test('no cues fails', () => assert.match(validateSubtitle('just some text', 'srt')!, /cues/));
test('wrong timestamp separator fails', () =>
  assert.match(validateSubtitle(srt.replaceAll(',', '.'), 'srt')!, /timestamp/i));
test('broken numbering fails', () =>
  assert.match(validateSubtitle(srt.replace('\n2\n', '\n3\n'), 'srt')!, /numbering/));
