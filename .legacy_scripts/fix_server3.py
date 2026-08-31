with open('server.ts', 'r') as f:
    lines = f.readlines()

insertion = """      let elevenLabsWs: import("ws").WebSocket | null = null;
      let elevenLabsQueue: string[] = [];
      
      function initElevenLabsWs() {
        if (elevenLabsWs) return elevenLabsWs;
"""

new_lines = lines[:110] + [insertion] + lines[110:]

with open('server.ts', 'w') as f:
    f.writelines(new_lines)
print("Fixed!")
