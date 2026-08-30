#!/bin/bash
cat << 'INNER_EOF' > temp.tsx
            {/* Result */}
            {generatedImage && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <img src={generatedImage} alt="Generated" className="w-full h-auto object-cover" />
              </div>
            )}
            
            {generatedPromptIdea && (
INNER_EOF

sed -i '/{\/\* Result \*\//,/{\/\* Result \*\//!b; /{\/\* Result \*\//r temp.tsx' src/components/ImageStudioModal.tsx
# Oops, sed -i and inserting is tricky. I'll use a simpler python script to replace the block.
