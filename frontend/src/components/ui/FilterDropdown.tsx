import { useState } from 'react';

interface FilterDropdownProps {
  label: string;
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  optionColors?: Record<string, string>;
}

export default function FilterDropdown({
  label,
  icon,
  iconBgColor,
  iconTextColor,
  options,
  value,
  onChange,
  optionColors
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-primary/30 transition-all w-full h-full text-left focus:outline-none"
      >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgColor} ${iconTextColor}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[15px] font-bold truncate ${optionColors?.[value] || 'text-slate-900'}`}>{value}</span>
            <span className={`material-symbols-outlined text-slate-400 text-lg transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          {/* Overlay to close when clicking outside */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full px-5 py-3 text-left text-sm font-bold transition-all flex items-center justify-between hover:bg-primary/5 ${value === option
                      ? (optionColors?.[option] || 'text-primary bg-primary/5')
                      : (optionColors?.[option] || 'text-slate-600 hover:text-primary')
                    }`}
                >
                  {option}
                  {value === option && (
                    <span className="material-symbols-outlined text-lg">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
