const fs = require('fs');
let code = fs.readFileSync('src/components/LiveAvatar.tsx', 'utf8');

const mouseTrackingRegex = /\s*\/\/ Handle smooth mouse tracking for parallax[\s\S]*?const handleMouseLeave = \(\) \=\> \{[\s\S]*?\};\n/m;

const newTrackingLogic = `
  // Handle smooth global mouse tracking for parallax eye/head movement
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const diffX = e.clientX - centerX;
      const diffY = e.clientY - centerY;
      
      // Sensitivity: distance in pixels to reach max tilt
      const sensitivity = window.innerWidth / 2.5; 
      const x = Math.max(-1, Math.min(1, diffX / sensitivity));
      const y = Math.max(-1, Math.min(1, diffY / sensitivity));
      
      targetTilt.current = { x, y };
      isHoveredRef.current = true; // Actively tracking cursor
      
      // Reset to idle if cursor leaves window boundaries
      if (
        e.clientX <= 10 || e.clientY <= 10 || 
        e.clientX >= window.innerWidth - 10 || e.clientY >= window.innerHeight - 10
      ) {
        isHoveredRef.current = false;
        targetTilt.current = { x: 0, y: 0 };
      }
    };

    const handleGlobalMouseLeave = () => {
      isHoveredRef.current = false;
      targetTilt.current = { x: 0, y: 0 };
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseleave', handleGlobalMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, []);
`;

code = code.replace(mouseTrackingRegex, newTrackingLogic);

code = code.replace(
  '      onMouseMove={handleMouseMove}\n      onMouseEnter={() => { setIsHovered(true); isHoveredRef.current = true; }}\n      onMouseLeave={handleMouseLeave}',
  '      onMouseEnter={() => setIsHovered(true)}\n      onMouseLeave={() => setIsHovered(false)}'
);

fs.writeFileSync('src/components/LiveAvatar.tsx', code);
console.log('LiveAvatar.tsx patched successfully');
