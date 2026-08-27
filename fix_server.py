import re

with open('server.ts', 'r') as f:
    content = f.read()

# I will find the config block and remove any initElevenLabsWs or streamTextToElevenLabs that might be lingering inside `config: { ... }`
# Wait, actually, between `outputAudioTranscription: {},` and `callbacks: {`, there is some orphaned code.

start_str = "outputAudioTranscription: {},"
end_str = "        callbacks: {"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx + len(start_str)] + "\n" + content[end_idx:]
    with open('server.ts', 'w') as f:
        f.write(new_content)
    print("Fixed!")
else:
    print("Not found")

