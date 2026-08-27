import re

with open('server.ts', 'r') as f:
    content = f.read()

# We want to find the first try { block starting around line 100.
# We will just rewrite server.ts using the original codebase, or we can just replace everything between line 159 and line 174.

lines = content.split('\n')
# Let's just find the exact dangling block and remove it.
# The dangling block starts around "          } else {" right after "        return elevenLabsWs;"

# Let's find "return elevenLabsWs;"
idx = -1
for i, line in enumerate(lines):
    if "return elevenLabsWs;" in line:
        idx = i
        break

if idx != -1:
    # We want to keep up to idx + 1 (the closing brace of initElevenLabsWs)
    # Then we want to find "const session = await ai.live.connect({"
    end_idx = -1
    for j in range(idx, len(lines)):
        if "const session = await ai.live.connect" in lines[j]:
            end_idx = j
            break
            
    if end_idx != -1:
        # Replace everything between idx+1 and end_idx with our correct streamTextToElevenLabs function
        
        replacement = """
      function streamTextToElevenLabs(text: string, isFinal: boolean = false) {
        if (text) {
          if (elevenLabsWs && elevenLabsWs.readyState === 1) { // OPEN
            elevenLabsWs.send(JSON.stringify({ text }));
          } else {
            elevenLabsQueue.push(text);
            initElevenLabsWs();
          }
        }
        if (isFinal) {
          if (elevenLabsWs && elevenLabsWs.readyState === 1) {
            elevenLabsWs.send(JSON.stringify({ text: "" }));
          } else {
            elevenLabsQueue.push("");
            initElevenLabsWs();
          }
        }
      }
"""
        new_lines = lines[:idx+2] + replacement.split('\n') + lines[end_idx:]
        with open('server.ts', 'w') as f:
            f.write('\n'.join(new_lines))
        print("Fixed!")

