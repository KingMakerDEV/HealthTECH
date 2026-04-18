// src/components/HeroScene.tsx
import Spline from '@splinetool/react-spline';
import { Loader2 } from 'lucide-react';

const HeroScene = () => {
  return (
    <div className="w-full h-full">
      <iframe
        src="https://app.spline.design/community/embed/740c63af-5b13-4ef1-87f9-9fbf69cb9080"
        width="100%"
        height="100%"
        style={{ border: 'none', background: 'transparent' }}
        title="Healthcare Spline Scene"
        allow="autoplay; fullscreen"
        loading="lazy"
      />
    </div>
  );
};

export default HeroScene;