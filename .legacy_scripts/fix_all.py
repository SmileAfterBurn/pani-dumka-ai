with open('src/App.tsx', 'r') as f:
    content = f.read()

# I need to undo the global replace.
content = content.replace("<button\n                              onClick={() => {", "<button")
with open('src/App.tsx', 'w') as f:
    f.write(content)
