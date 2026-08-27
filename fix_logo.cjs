const fs = require('fs');

const newContent = `import React from "react";

interface PaniDumkaLogoProps {
  className?: string;
  onClick?: () => void;
}

export const PaniDumkaLogo: React.FC<PaniDumkaLogoProps> = ({ className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={\`flex items-center select-none cursor-pointer group \${className}\`}
    >
      <img 
        src="/pani-dumka-ai-logo-320x132.png" 
        alt="Пані Думка Ai" 
        className="h-10 w-auto object-contain transform transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
};
`;

fs.writeFileSync('src/components/PaniDumkaLogo.tsx', newContent);
console.log('Logo updated');
