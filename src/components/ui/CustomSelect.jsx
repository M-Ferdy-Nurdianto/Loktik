import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih Option...',
  accentColor = 'green', // 'green' | 'blue' | 'purple'
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const borderAccent =
    accentColor === 'blue'
      ? 'border-brand-blue'
      : accentColor === 'purple'
      ? 'border-brand-purple'
      : 'border-brand-green';

  const textAccent =
    accentColor === 'blue'
      ? 'text-brand-blue'
      : accentColor === 'purple'
      ? 'text-brand-purple'
      : 'text-brand-green';

  return (
    <div ref={dropdownRef} className={`relative w-full text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-bold uppercase flex items-center justify-between transition-colors focus:outline-none ${
          isOpen ? borderAccent : 'hover:border-neutral-700'
        }`}
      >
        <span className="truncate pr-2">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#181818] border border-neutral-800 rounded-md shadow-2xl z-50 max-h-56 overflow-y-auto no-scrollbar py-1 space-y-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs font-bold uppercase text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? `bg-neutral-900 ${textAccent}`
                    : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className={`w-3.5 h-3.5 shrink-0 ${textAccent}`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
