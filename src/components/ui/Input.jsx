import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Editorial Streetwear Input Component with optional Show Password toggle
 */
export const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left mb-4">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
          {label} {required && <span className="text-brand-red">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-2.5 bg-neutral-900 text-white font-medium text-sm rounded-md
            border border-neutral-700 transition-all duration-200
            focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green
            placeholder:text-neutral-500
            ${isPassword ? 'pr-11' : ''}
            ${error ? 'border-brand-red bg-red-950/20' : ''}
            ${className}
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-neutral-400 hover:text-white p-1 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {helpText && <p className="text-xs text-neutral-500 font-normal">{helpText}</p>}
      {error && <p className="text-xs text-brand-red font-bold uppercase tracking-wider">{error}</p>}
    </div>
  );
};
