const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

if (!key) {
  console.error("Please set the GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable.");
  process.exit(1);
}

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error('API Error:', data.error.message);
      return;
    }
    console.log(data.models?.map(m => m.name).join('\n') || 'No models returned');
  })
  .catch(console.error);
