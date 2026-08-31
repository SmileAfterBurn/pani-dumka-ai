with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

out = []
i = 0
while i < len(lines):
    if lines[i].strip() == "<button" and lines[i+1].strip() == "onClick={() => {" and lines[i+2].strip() == "<button":
        i += 2
        continue
    out.append(lines[i])
    i += 1

with open('src/App.tsx', 'w') as f:
    f.writelines(out)
