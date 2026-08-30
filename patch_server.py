import re

with open('server.ts', 'r') as f:
    content = f.read()

helper = """
function getGoogleGenAIClient(): GoogleGenAI {
  if (process.env.GOOGLE_GENAI_USE_ENTERPRISE === 'True' || process.env.GOOGLE_CLOUD_PROJECT) {
    console.log("Using Vertex AI (Enterprise) configuration.");
    return new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  } else {
    console.log("Using standard Gemini API configuration.");
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
}
"""

content = re.sub(
    r'const ai = new GoogleGenAI\(\{[\s\S]*?\}\);',
    'const ai = getGoogleGenAIClient();',
    content
)

# Insert the helper function right after imports
if "function getGoogleGenAIClient" not in content:
    content = re.sub(
        r'(import .*?;[\r\n]+)(const upload = multer)',
        r'\1' + helper + r'\n\2',
        content,
        count=1
    )

with open('server.ts', 'w') as f:
    f.write(content)
