const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Update body in base layer
css = css.replace(/body\s*\{[\s\S]*?min-height:\s*100vh;\s*\}/, `body {
    background-color: #F8F9FA;
    color: #0F172A;
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    
    /* Modern Luminous White & Embroidered Thread Aura */
    background: 
      radial-gradient(circle at 15% 10%, rgba(220, 38, 38, 0.035) 0%, transparent 45%),
      radial-gradient(circle at 85% 15%, rgba(0, 87, 183, 0.04) 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.25) 0%, transparent 60%),
      radial-gradient(circle at 50% 90%, rgba(220, 38, 38, 0.03) 0%, transparent 45%),
      #FBFBFA;
    min-height: 100vh;
    transition: background-color 0.4s ease, color 0.4s ease;
  }
  
  .dark body {
    background-color: #0B0F19;
    color: #F8FAFC;
    background: 
      radial-gradient(circle at 15% 10%, rgba(220, 38, 38, 0.04) 0%, transparent 45%),
      radial-gradient(circle at 85% 15%, rgba(0, 87, 183, 0.05) 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(153, 27, 27, 0.03) 0%, transparent 60%),
      radial-gradient(circle at 50% 90%, rgba(220, 38, 38, 0.035) 0%, transparent 45%),
      #0B0F19;
  }`);

// Update .glass in components layer
css = css.replace(/\.glass\s*\{[\s\S]*?box-shadow:[\s\S]*?;\s*\}/, `.glass {
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(226, 232, 240, 0.9);
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
  }
  
  .dark .glass {
    background: rgba(15, 23, 42, 0.65);
    border-color: rgba(51, 65, 85, 0.8);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  }`);

// Update .glass-card
css = css.replace(/\.glass-card\s*\{[\s\S]*?transition:[\s\S]*?;\s*\}/, `.glass-card {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(226, 232, 240, 0.85);
    box-shadow: 0 14px 34px -8px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dark .glass-card {
    background: rgba(15, 23, 42, 0.75);
    border-color: rgba(51, 65, 85, 0.7);
    box-shadow: 0 14px 34px -8px rgba(0, 0, 0, 0.4);
  }`);

// Update .glass-card:hover
css = css.replace(/\.glass-card:hover\s*\{[\s\S]*?transform:[\s\S]*?;\s*\}/, `.glass-card:hover {
    border-color: rgba(220, 38, 38, 0.35);
    box-shadow: 0 18px 38px -8px rgba(220, 38, 38, 0.08), 0 6px 16px -2px rgba(15, 23, 42, 0.04);
    transform: translateY(-2px);
  }
  
  .dark .glass-card:hover {
    border-color: rgba(220, 38, 38, 0.45);
    box-shadow: 0 18px 38px -8px rgba(220, 38, 38, 0.15), 0 6px 16px -2px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }`);

fs.writeFileSync('src/index.css', css);
