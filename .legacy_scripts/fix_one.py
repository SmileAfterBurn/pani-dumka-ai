with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if "<button" in lines[i] and "setIsWorkspaceOpen(true);" in lines[i+1]:
        lines.insert(i+1, "                              onClick={() => {\n")
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
