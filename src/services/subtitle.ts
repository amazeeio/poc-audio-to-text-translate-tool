export type SubtitleFormat = 'srt' | 'vtt';

const TIMESTAMP = {
  srt: /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/,
  vtt: /^(\d{2,}:)?\d{2}:\d{2}\.\d{3} --> (\d{2,}:)?\d{2}:\d{2}\.\d{3}/,
};

/**
 * Validates SRT/VTT structure: header, timestamp lines, and (for SRT)
 * sequential cue numbering. Returns null if valid, otherwise a message
 * describing the first problem found.
 */
export const validateSubtitle = (text: string, format: SubtitleFormat): string | null => {
  const trimmed = text.trim();
  if (!trimmed) return 'Output is empty';
  if (format === 'vtt' && !trimmed.startsWith('WEBVTT')) {
    return 'Missing "WEBVTT" header on first line';
  }

  const lines = trimmed.split(/\r?\n/);
  const cueIndexes = lines.reduce<number[]>((acc, line, i) => {
    if (line.includes('-->')) acc.push(i);
    return acc;
  }, []);
  if (cueIndexes.length === 0) return 'No timestamp cues ("-->") found';

  for (const i of cueIndexes) {
    if (!TIMESTAMP[format].test(lines[i].trim())) {
      return `Malformed ${format.toUpperCase()} timestamp: "${lines[i].trim().slice(0, 50)}"`;
    }
  }

  if (format === 'srt') {
    let expected = 1;
    for (const i of cueIndexes) {
      const num = Number(lines[i - 1]?.trim());
      if (num !== expected) {
        return `Cue numbering broken: expected ${expected}, got "${(lines[i - 1] ?? '').trim()}"`;
      }
      expected++;
    }
  }

  return null;
};
