import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make the extraction more robust
robust_extract = """
        const responseText = aiResponse?.text?.trim() || "@chat";
        // Extract the first word starting with @
        const match = responseText.match(/@\\w+/);
        const decidedTag = match ? match[0] : "@chat";
        console.log(`[Orchestrator] Autonomous decision reached. Selected: ${decidedTag} (Raw: ${responseText})`);
"""

content = re.sub(
    r'const decidedTag = aiResponse\?\.text\?\.trim\(\) \|\| "@chat";\s*console\.log\(`\[Orchestrator\] Autonomous decision reached\. Selected: \$\{decidedTag\}`\);',
    robust_extract.strip(),
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
