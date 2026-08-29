import React, { Suspense, lazy } from 'react';

const ReproductiveSystem3DCore = lazy(() =>
  import('./ReproductiveSystem3D').then((m) => ({ default: m.ReproductiveSystem3D }))
);

const BiologicalSystemSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={`relative flex items-center justify-center pointer-events-none select-none ${className || 'w-full h-full min-h-[420px]'}`}
    aria-hidden="true"
  >
    {/* Ambient Glow */}
    <div className="absolute w-72 sm:w-88 h-72 sm:h-88 rounded-full bg-gradient-to-tr from-[#6E2D8B]/35 via-[#8E3EAF]/25 to-[#E87084]/30 blur-[60px]" />

    {/* Central Anatomical Silhouette */}
    <div className="relative w-40 h-44 sm:w-48 sm:h-52 rounded-[40%_40%_60%_60%/40%_40%_70%_70%] bg-gradient-to-b from-[#7E22CE]/80 via-[#6E2D8B]/75 to-[#4A154B]/85 border border-white/20 shadow-2xl backdrop-blur-md">
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/10 blur-xs" />
    </div>

    {/* Bilateral Ovaries */}
    <div className="absolute left-[10%] sm:left-[15%] top-1/3 w-12 h-10 sm:w-14 sm:h-12 rounded-full bg-gradient-to-br from-[#FB7185] to-[#A21CAF] border border-white/30 shadow-lg flex items-center justify-center">
      <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
    </div>
    <div className="absolute right-[10%] sm:right-[15%] top-1/3 w-12 h-10 sm:w-14 sm:h-12 rounded-full bg-gradient-to-bl from-[#C084FC] to-[#8E3EAF] border border-white/30 shadow-lg flex items-center justify-center">
      <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
    </div>
  </div>
);

export const LazyReproductiveSystem3D: React.FC<{
  className?: string;
  onSettle?: () => void;
  showDataNodes?: boolean;
}> = (props) => {
  return (
    <Suspense fallback={<BiologicalSystemSkeleton className={props.className} />}>
      <ReproductiveSystem3DCore {...props} />
    </Suspense>
  );
};
