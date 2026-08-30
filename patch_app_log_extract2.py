with open('src/App.tsx', 'r') as f:
    content = f.read()

robust_extract = """
        const responseText = aiResponse?.text?.trim() || "@chat";
        const match = responseText.match(/@\\w+/);
        const decidedTag = match ? match[0] : "@chat";
        console.log(`[Orchestrator] Autonomous decision reached. Selected: ${decidedTag} (Raw: ${responseText})`);
"""

old_target = 'const decidedTag = aiResponse?.text?.trim() || "@chat";\n        console.log(`[Orchestrator] Autonomous decision reached. Selected: ${decidedTag}`);'

content = content.replace(old_target, robust_extract.strip())

with open('src/App.tsx', 'w') as f:
    f.write(content)
