const fs = require('fs');
let code = fs.readFileSync('src/components/LiveAvatar.tsx', 'utf8');

// 1. Update the interval to 3-7 seconds
code = code.replace(
  'const interval = 2800 + Math.random() * 4200;',
  'const interval = 3000 + Math.random() * 4000;'
);

// 2. Add an Eyelid overlay in the eye containers
// Let's replace the eye rendering block.
const leftEyeRegex = /\{\/\* Left Eye Luminous Glint \*\/\}([\s\S]*?)\{\/\* Right Eye Luminous Glint \*\/\}/m;
const rightEyeRegex = /\{\/\* Right Eye Luminous Glint \*\/\}([\s\S]*?)\<\/div>\s*\{\/\* Layer 6: Traditional/m;

// We will add an eyelid inside the relative container of each eye.
const getEyeContent = (delay) => `
            <div className="relative w-8 h-5 flex items-center justify-center overflow-hidden rounded-full">
              <AnimatePresence>
                {!isBlinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.05 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{
                        opacity: [0.6, 0.9, 0.6],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut", delay: ${delay} }}
                      className="w-3.5 h-3.5 rounded-full bg-cyan-300/40 blur-[1.5px] shadow-[0_0_6px_#38bdf8]"
                      style={{
                        transform: \`translate(\${eyeShiftX * 0.7}px, \${eyeShiftY * 0.7}px)\`,
                      }}
                    />
                    <div 
                      className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_#fff]"
                      style={{
                        transform: \`translate(calc(-1px + \${eyeShiftX * 0.9}px), calc(-1px + \${eyeShiftY * 0.9}px))\`,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Animated Eyelid for Blink */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: isBlinking ? '100%' : '0%' }}
                transition={{ duration: 0.1, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-full bg-[#d6a98b]/90 backdrop-blur-sm z-10"
                style={{ originY: 0, borderBottom: isBlinking ? '1px solid #b48569' : 'none' }}
              />
            </div>
`;

code = code.replace(leftEyeRegex, '{/* Left Eye Luminous Glint */}' + getEyeContent(0) + '            {/* Right Eye Luminous Glint */}');
code = code.replace(rightEyeRegex, '{/* Right Eye Luminous Glint */}' + getEyeContent(0.3) + '          </div>\n          {/* Layer 6: Traditional');

fs.writeFileSync('src/components/LiveAvatar.tsx', code);
console.log('LiveAvatar.tsx blinking patched successfully');
