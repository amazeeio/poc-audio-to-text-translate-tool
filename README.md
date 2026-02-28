# Audio to Text Translation Tool (PoC)

This is a Proof of Concept (PoC) project for audio-to-text transcription with translation. It provides a UI for uploading audio files, transcribing them to text, and translating the resulting text.

## Purpose

The primary goal of this application is to test the LiteLLM endpoint for the **amazee.ai** provider. It serves as a testing ground to verify connectivity and validate responses from the endpoint.

## Configuration

To connect this application to the LiteLLM endpoint, you must provide the necessary API credentials and endpoint URL using environment variables.

1. Create a `.env.development` file in the root of the project.
2. Add your LLM URL and API Key to the file. For example:

```env
GATSBY_LITELLM_API_URL="<your-litellm-endpoint-url>"
GATSBY_LITELLM_API_KEY="<your-litellm-api-key>"
```

*Note: Environment variables prefixed with `GATSBY_` will become available to the client-side code.*

## Local Development

**Prerequisites:** You will need [Node.js](https://nodejs.org/) installed on your machine, along with [pnpm](https://pnpm.io/).

1. Install dependencies:
   ```shell
   pnpm install
   ```

2. Start the development server:
   ```shell
   pnpm run dev
   ```

3. Open the application in your browser (typically `http://localhost:8000`).
