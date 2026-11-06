# Audio to Text Translation Tool (PoC)

This is a Proof of Concept (PoC) project for audio-to-text transcription with translation. It provides a UI for uploading audio files, transcribing them to text, and translating the resulting text.

## Purpose

The primary goal of this application is to test the LiteLLM endpoint for the **amazee.ai** provider. It serves as a testing ground to verify connectivity and validate responses from the endpoint.

## Configuration

To connect this application to the LiteLLM endpoint, you must provide the necessary API credentials and endpoint URL using environment variables.

1. Create a `.env.development` file (or `.env.local`) in the root of the project.
2. Add your LLM URL and API Key to the file. For example:

```env
VITE_LITELLM_API_URL="<your-litellm-endpoint-url>"
VITE_LITELLM_API_KEY="<your-litellm-api-key>"
```

*Note: Environment variables prefixed with `VITE_` will become available to the client-side code.*

## Local Development

**Prerequisites:** You will need [Node.js](https://nodejs.org/) installed on your machine, along with [pnpm](https://pnpm.io/).

1. Install dependencies:
   ```shell
   pnpm install
   ```

2. Start the development server:
   ```shell
   pnpm dev
   ```

3. Open the application in your browser at `http://localhost:8000`. Requests to `/v1/*` are proxied to `VITE_LITELLM_API_URL` (see `vite.config.ts`).

## Using Soniox through LiteLLM in your own tool

You don't need this PoC to use Soniox. LiteLLM exposes it on the standard OpenAI-style endpoint `POST /v1/audio/transcriptions`, so any HTTP client works. This PoC is a convenient place to try settings: after a run, the "Last Request (cURL)" panel shows the exact request it sent, which you can copy.

### How a request works

- Use a model whose name starts with `stt-`, e.g. `stt-async-v5`.
- Send `multipart/form-data` with `file`, `model`, and optionally `response_format` (`json`, `text`, `verbose_json`, `srt`, `vtt`) and `language`. LiteLLM turns `language` into a Soniox language hint.
- Send Soniox-specific options as extra form fields. Fields that hold an object, such as `context` and `translation`, are sent as JSON strings.
- The call is **synchronous**. LiteLLM uploads the file to Soniox, polls until the transcription is done, returns the result, and then deletes the file from Soniox. The HTTP request stays open for the whole job, so set a generous client timeout.

| Form field | Purpose |
|---|---|
| `language_hints[]` (repeatable) | Languages you expect, e.g. `en`, `de`. Improves accuracy. |
| `language_hints_strict=true` | Only transcribe in the hinted languages. |
| `enable_language_identification=true` | Tag each segment with its language. Needed for mixed-language audio. |
| `enable_speaker_diarization=true` | Label speakers (`Speaker 1:`, `Speaker 2:` …). |
| `context` | JSON object that tells Soniox about the domain (see below). |
| `translation` | `{"type":"one_way","target_language":"de"}` or `{"type":"two_way","language_a":"en","language_b":"es"}` |
| `soniox_polling_interval` | Seconds between LiteLLM's status checks (0.5–60, default 1). Handled by LiteLLM ≥ 1.108 and not sent to Soniox. |
| `soniox_max_polling_attempts` | Maximum number of status checks (default 1800 ≈ 30 min at 1 s, maximum 6000). Raise it for long files. |

### The Context API

The `context` field ([Soniox docs](https://soniox.com/docs/stt/concepts/context)) is the most effective way to improve accuracy on names, jargon and product terms. All four sections are optional:

```json
{
  "general": [
    { "key": "domain", "value": "Healthcare" },
    { "key": "topic", "value": "Cardiology follow-up visit" }
  ],
  "text": "Free-form background: an agenda, a script, notes from a previous meeting.",
  "terms": ["Celebrex", "Zyrtec", "amazee.ai"],
  "translation_terms": [
    { "source": "Mr. Smith", "target": "Sr. Smith" }
  ]
}
```

- `general`: short key/value facts such as the domain, topic, speaker names or setting.
- `text`: longer background prose. Keep it relevant, because Soniox limits the total context size.
- `terms`: words that must be spelled exactly as given.
- `translation_terms`: fixed translations, e.g. brand names that should stay untranslated or a required glossary.

Build the context once for each recording or customer, and reuse it for every request about that recording.

### Example request

```shell
curl -X POST "$LITELLM_URL/v1/audio/transcriptions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  --max-time 3600 \
  -F "file=@meeting.mp3" \
  -F "model=stt-async-v5" \
  -F "response_format=json" \
  -F "language_hints[]=en" \
  -F "language_hints[]=de" \
  -F "enable_language_identification=true" \
  -F "enable_speaker_diarization=true" \
  -F 'context={"general":[{"key":"domain","value":"Finance"}],"terms":["EBITDA","amazee.ai"]}' \
  -F 'translation={"type":"one_way","target_language":"de"}'
```

The response has the shape `{"text": "...", ...}`. When diarization, language identification or translation is on, `text` contains inline tags:

```
Speaker 1:
[en] Welcome everyone to the quarterly review.
[Translation] [de] Willkommen alle zur Quartalsbesprechung.
```

To split original text from translation, parse those tags. Lines that start with `[Translation] [xx]` hold translated text, and lines that start with `[xx]` hold the original speech. `srt`/`vtt` output only includes the original-language text, because Soniox does not timestamp translated tokens.

### Transcribing into multiple languages

A Soniox `translation` produces **one** target language (`one_way`), or translates both ways between **one** language pair (`two_way`). To get several languages:

1. **One target language:** use `one_way` in the same request. This is the cheapest option and keeps the translation aligned with the speech.
2. **Two languages spoken in the audio** (e.g. an English/Spanish interview): use `two_way` with `language_a`/`language_b`. Each speaker's words are translated into the other language.
3. **Several target languages:** transcribe **once** without `translation`. Then send the transcript to `/v1/chat/completions` once per target language, and run those requests in parallel. Put your `translation_terms` glossary in the system prompt so the terms match the Soniox output. This is what the PoC's second step does. The alternative, a separate Soniox request for each language, transcribes the same audio again each time and costs more.

### Long recordings (e.g. 1 hour or more)

Soniox can process long files, but a single synchronous request for an hour of audio is fragile. The HTTP connection stays open for the whole job. A load balancer or client timeout can drop it, and if that happens you retry the whole hour. We recommend splitting the audio:

- **Use chunks of about 10 minutes**, and cut at silences rather than at exact time marks, so that no word is split in half. Use `ffmpeg`'s `silencedetect` filter to find a silence near each 10-minute mark. For a simple first version, a fixed `segment_time` works.
- **Shrink the audio before upload.** Speech doesn't need more than mono 16 kHz. FLAC is lossless and small, and Opus is even smaller.
- **Process chunks in parallel** with a small limit (3–4 at a time), and retry failed chunks on their own.
- **Send the same `context`** with every chunk. To keep names and topics consistent across chunk boundaries, you can also add the last sentence or two of the previous chunk's transcript to `context.text`. This means those chunks must run in order instead of in parallel.
- **Shift timestamps.** Each chunk's timestamps start at 0. Add the chunk's start offset to `verbose_json` word times, or to SRT/VTT cues, before you merge the chunks.
- **Speaker labels reset in each chunk.** `Speaker 1` in chunk 2 may not be the same person as `Speaker 1` in chunk 1. If you need speaker labels that stay the same across the whole recording, send the full file in a single request and raise `soniox_max_polling_attempts` (and your client timeout).

Splitting with ffmpeg (fixed 10-minute chunks, re-encoded to mono 16 kHz FLAC):

```shell
ffmpeg -i recording.mp3 -ac 1 -ar 16000 -c:a flac \
  -f segment -segment_time 600 -reset_timestamps 1 chunk_%03d.flac
```

Minimal Python client that splits, transcribes in parallel and merges:

```python
import glob, json, requests
from concurrent.futures import ThreadPoolExecutor

URL = "https://<your-litellm-endpoint>/v1/audio/transcriptions"
KEY = "<your-litellm-api-key>"
CHUNK_SECONDS = 600
CONTEXT = {"general": [{"key": "domain", "value": "Finance"}], "terms": ["EBITDA"]}

def transcribe(path, retries=3):
    for attempt in range(retries):
        try:
            with open(path, "rb") as f:
                r = requests.post(
                    URL,
                    headers={"Authorization": f"Bearer {KEY}"},
                    files={"file": f},
                    data={
                        "model": "stt-async-v5",
                        "response_format": "json",
                        "language_hints[]": ["en", "de"],
                        "enable_language_identification": "true",
                        "context": json.dumps(CONTEXT),
                        "translation": json.dumps({"type": "one_way", "target_language": "de"}),
                    },
                    timeout=1800,
                )
            r.raise_for_status()
            return r.json()["text"]
        except requests.RequestException:
            if attempt == retries - 1:
                raise

chunks = sorted(glob.glob("chunk_*.flac"))
with ThreadPoolExecutor(max_workers=4) as pool:
    texts = list(pool.map(transcribe, chunks))

for i, text in enumerate(texts):
    print(f"--- {i * CHUNK_SECONDS // 60} min ---\n{text}\n")
```
