import React from 'react';

export const LifestyleSkeleton: React.FC = () => {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse"
      role="status"
      aria-label="Loading lifestyle recommendations"
    >
      {/* Header Skeleton */}
      <div className="rounded-2xl bg-white border border-[#D7EAF2] p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-24 bg-slate-200 rounded-full" />
              <div className="h-5 w-32 bg-slate-200 rounded-full" />
            </div>
            <div className="h-8 w-64 sm:w-80 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 sm:w-96 bg-slate-100 rounded" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Today's Priority Featured Skeleton */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200/70 border border-[#D7EAF2] p-6 sm:p-8 space-y-4">
        <div className="h-4 w-32 bg-slate-300 rounded" />
        <div className="h-7 w-3/4 sm:w-1/2 bg-slate-300 rounded-lg" />
        <div className="h-4 w-full sm:w-2/3 bg-slate-200 rounded" />
        <div className="flex items-center gap-3 pt-2">
          <div className="h-9 w-40 bg-slate-300 rounded-xl" />
          <div className="h-6 w-24 bg-slate-200 rounded-full" />
        </div>
      </div>

      {/* Status Summary Skeleton */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <div className="h-9 w-28 bg-slate-200 rounded-xl shrink-0" />
        <div className="h-9 w-28 bg-slate-200 rounded-xl shrink-0" />
        <div className="h-9 w-28 bg-slate-200 rounded-xl shrink-0" />
        <div className="h-9 w-28 bg-slate-200 rounded-xl shrink-0" />
      </div>

      {/* Tab Bar Skeleton */}
      <div className="flex items-center gap-3 border-b border-[#D7EAF2] pb-3">
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
        <div className="h-10 w-44 bg-slate-200 rounded-xl" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-[#D7EAF2] p-6 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 bg-slate-200 rounded" />
              <div className="h-5 w-24 bg-slate-200 rounded-full" />
            </div>
            <div className="h-6 w-4/5 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
            <div className="flex items-center gap-2 pt-2">
              <div className="h-6 w-16 bg-slate-100 rounded-md" />
              <div className="h-6 w-20 bg-slate-100 rounded-md" />
              <div className="h-6 w-24 bg-slate-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
