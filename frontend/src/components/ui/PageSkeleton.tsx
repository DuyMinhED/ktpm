import React from 'react';
import Skeleton from './Skeleton';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-4 w-full`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-1/2" />
            </div>
            <Skeleton variant="circular" className="size-12 flex-shrink-0" />
          </div>
          <div className="mt-2 flex justify-between">
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header Area */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center gap-4">
        <Skeleton className="h-7 w-1/4" />
        <div className="flex gap-2 w-1/2 justify-end">
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      {/* Table Data */}
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 py-3 border-b border-slate-50 dark:border-slate-700/40 last:border-0">
            <Skeleton variant="circular" className="size-10 flex-shrink-0" />
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div className="space-y-1.5 col-span-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              {Array.from({ length: cols - 1 }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full rounded-md" />
              ))}
            </div>
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Calendar Grid */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`day-${i}`} className="h-6 w-full rounded-md" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={`cell-${i}`} className="min-h-[90px] w-full rounded-xl" />
          ))}
        </div>
      </div>
      
      {/* Sidebar Agenda */}
      <div className="lg:col-span-4 flex flex-col h-full space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-sm flex-1">
          <Skeleton className="h-12 w-full rounded-xl mb-2" />
          <Skeleton className="h-5 w-1/2 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-slate-100 dark:border-slate-700 rounded-2xl flex gap-4 items-center">
              <Skeleton variant="circular" className="size-10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-sm">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-end gap-4 w-full" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const randomHeight = Math.floor(Math.random() * 70) + 20; // random 20-90%
          return (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t-lg rounded-b-none" 
              style={{ height: `${randomHeight}%` }} 
            />
          );
        })}
      </div>
    </div>
  );
};

export const ChatSkeleton: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Sidebar contacts */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-700 p-4 space-y-6">
        <Skeleton className="h-10 w-full rounded-xl mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <Skeleton variant="circular" className="size-12 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between"><Skeleton className="h-4 w-2/3"/><Skeleton className="h-3 w-8"/></div>
              <Skeleton className="h-3 w-3/4"/>
            </div>
          </div>
        ))}
      </div>
      {/* Main chat panel */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <Skeleton variant="circular" className="size-10 flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        {/* Messages area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-hidden">
          <div className="flex items-start gap-3">
            <Skeleton variant="circular" className="size-8 flex-shrink-0" />
            <Skeleton className="h-12 w-[40%] rounded-2xl rounded-tl-none" />
          </div>
          <div className="flex items-start justify-end gap-3">
            <Skeleton className="h-20 w-[50%] rounded-2xl rounded-tr-none" />
          </div>
          <div className="flex items-start gap-3">
            <Skeleton variant="circular" className="size-8 flex-shrink-0" />
            <Skeleton className="h-10 w-[30%] rounded-2xl rounded-tl-none" />
          </div>
        </div>
        {/* Input box */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};
