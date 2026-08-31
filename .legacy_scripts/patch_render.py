import re

with open('src/components/ImageStudioModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """            {/* Result */}
            {generatedImage && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mt-4">
                <img src={generatedImage} alt="Generated" className="w-full h-auto object-cover" />
              </div>
            )}
            {generatedPromptIdea && ("""

content = content.replace("            {/* Result */}\n            {generatedPromptIdea && (", replacement)

# Change button text as well
content = content.replace("<span>Згенерувати художній концепт</span>", "<span>Згенерувати Зображення</span>")
content = content.replace("<span>Синтез візуального концепту...</span>", "<span>Генерація зображення...</span>")

with open('src/components/ImageStudioModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
