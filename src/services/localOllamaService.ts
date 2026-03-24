export const transcribeAudioWithOllama = async (
  file: File,
  model: string = 'gpt-4o-transcribe'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Audio = (reader.result as string).split(',')[1];

        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            prompt: "Please transcribe the following audio:\n\n",
            images: [base64Audio],
            stream: false,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ollama Transcription Error:', errorText);
          throw new Error(`Ollama Error Status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // Ollama `/api/generate` returns the generated text in the `response` field
        resolve(data.response || '');
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the audio file'));
    };

    reader.readAsDataURL(file);
  });
};
