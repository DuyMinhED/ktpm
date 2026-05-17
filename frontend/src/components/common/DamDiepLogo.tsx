import React from 'react';

interface DamDiepLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

const DamDiepLogo: React.FC<DamDiepLogoProps> = ({
  size = 40,
  className = '',
  showText = true,
  textClassName = 'text-xl font-extrabold text-slate-900 dark:text-white leading-none'
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(8, 145, 178, 0.25))' }}
        >
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0891B2" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          {/* Rounded square background */}
          <rect width="64" height="64" rx="16" fill="url(#logo-grad)" />
          {/* Heart silhouette */}
          <path
            d="M32 50C32 50 14 38 14 26c0-5.5 4.5-10 10-10 3.5 0 6.5 1.8 8 4.5C33.5 17.8 36.5 16 40 16c5.5 0 10 4.5 10 10C50 38 32 50 32 50z"
            fill="white"
            opacity="0.15"
          />
          {/* ECG Pulse line */}
          <path
            d="M12 32h10l3-8 4 16 4-12 3 4h16"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Leaf accent */}
          <path
            d="M44 18c0 0-4 2-6 6s-1 8-1 8c0 0 4-2 6-6s1-8 1-8z"
            fill="white"
            opacity="0.4"
          />
          <path
            d="M44 18c-3 3-5 7-5.5 10"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.5"
            fill="none"
          />
        </svg>
      </div>
      {showText && (
        <div>
          <h1 className={textClassName}>
            Dam<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0891B2] to-[#059669]">Diep</span>
          </h1>
        </div>
      )}
    </div>
  );
};

export default DamDiepLogo;
