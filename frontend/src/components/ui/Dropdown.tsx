import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: 'default' | 'badge';
  icon?: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Dropdown({
  options,
  value,
  onChange,
  className = "",
  variant = 'default',
  icon,
  disabled = false,
  size = 'md'
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: DropdownOption[] = options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value) || normalizedOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative flex items-center justify-between gap-3 transition-all duration-300
          ${variant === 'badge'
            ? 'px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-400 dark:border-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800'
            : `pr-4 ${size === 'sm' ? 'min-h-[36px]' : 'min-h-[42px]'} bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-700 rounded-full shadow-sm ${icon ? 'pl-11' : 'pl-4'}`
          }
          ${isOpen
            ? 'border-primary shadow-lg shadow-primary/10 ring-4 ring-primary/5'
            : 'hover:border-slate-500 dark:hover:border-slate-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : 'active:scale-[0.98]'}
          w-full
        `}
      >
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            {icon}
          </div>
        )}
        <span className={`${
          size === 'sm' 
            ? 'text-[13.5px] md:text-[14px]' 
            : size === 'lg' 
              ? 'text-[16px]' 
              : 'text-[14px] md:text-[15px]'
        } font-bold font-display whitespace-nowrap ${variant === 'badge' ? 'text-slate-600 dark:text-slate-300' : 'text-slate-700 dark:text-slate-200'}`}>
          {selectedOption?.label}
        </span>
        <ChevronDown
          className={`
            w-4 h-4 text-slate-400 transition-transform duration-300
            ${isOpen ? 'rotate-180 text-primary' : ''}
          `}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`
          absolute left-0 right-0 top-full mt-2
          bg-white dark:bg-slate-900
          border border-slate-100 dark:border-slate-800
          rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/100
          z-[999] max-h-60 overflow-y-auto custom-scrollbar
          transition-all duration-200
          ${isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
          }
        `}
      >
        <div className="py-1">
          {normalizedOptions.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-2.5 
                  text-${size === 'sm' ? '[13.5px]' : size === 'lg' ? 'base' : '[14.5px]'} font-bold transition-colors
                  ${isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }
                `}
              >
                <span className="font-display">{option.label}</span>
                {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}