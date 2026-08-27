const fs = require('fs');
let code = fs.readFileSync('src/components/LiveAvatar.tsx', 'utf8');

const oldAura = /\s*\{\/\* Atmospheric Emotional Aura Bloom \*\/\}\s*\<div\s*className="absolute \-inset\-6 rounded\-full blur\-2xl transition\-all duration\-700 pointer\-events\-none"\s*style=\{\{\s*backgroundColor: emotionConfig\.glowColor,\s*opacity: state === 'speaking' \? 0\.8 : 0\.45,\s*transform: \`scale\(\$\{state === 'speaking' \? 1\.1 \+ speechAmplitude \* 0\.15 : 1\}\)\`\s*\}\}\s*\/\>/m;

const newAura = `      {/* Atmospheric Emotional Aura Bloom */}
      <motion.div
        className="absolute -inset-8 rounded-full blur-2xl pointer-events-none"
        animate={{
          backgroundColor: emotionConfig.glowColor,
          opacity: state === 'speaking' ? [0.6, 0.85, 0.6] : [0.35, 0.6, 0.35],
          scale: state === 'speaking' ? [1.0, 1.1 + speechAmplitude * 0.15, 1.0] : [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: state === 'speaking' ? 1.2 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          backgroundColor: { duration: 1.5, ease: "easeInOut" } // Smooth transition when emotion changes
        }}
      />`;

code = code.replace(oldAura, '\n' + newAura);

fs.writeFileSync('src/components/LiveAvatar.tsx', code);
console.log('LiveAvatar.tsx aura patched successfully');
