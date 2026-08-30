import re

with open('server.ts', 'r') as f:
    content = f.read()

content = re.sub(
    r'const fallbackModels = \["gemini-3\.7-flash", "gemini-3\.5-flash", "gemini-2\.5-flash", "gemini-2\.5-pro"\];',
    'const fallbackModels = ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.5-pro"];',
    content
)

content = re.sub(
    r'const requestedModel = initialParams\.model \|\| "gemini-3\.7-flash";',
    'const requestedModel = initialParams.model || "gemini-3.5-flash";',
    content
)

with open('server.ts', 'w') as f:
    f.write(content)
