'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function CustomSelect({
  id,
  name,
  value,
  onChange,
  disabled = false,
  className = '',
  required = false,
  children
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    console.log('Option clicked:', optionValue, 'for field:', name);
    
    const syntheticEvent = {
      target: {
        name,
        value: optionValue
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  // Get display value for country (show name instead of code)
  const getDisplayValue = () => {
    if (!value) return 'Выберите...';
    
    // For country field, we need to show the name instead of code
    if (name === 'country') {
      const options = React.Children.toArray(children);
      const selectedOption = options.find(option => 
        React.isValidElement(option) && 
        (option.props as any).value === value
      );
      
      return selectedOption && React.isValidElement(selectedOption) 
        ? (selectedOption.props as any).children 
        : value;
    }
    
    return value;
  };



  return (
    <div ref={selectRef} className="relative">
      <div
        onClick={handleSelectClick}
        className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 border border-gray-300 outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition cursor-pointer ${className} ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        {getDisplayValue()}
      </div>
      
      {isOpen && !disabled && (
        <div 
          className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          style={{ 
            zIndex: 999999,
            pointerEvents: 'auto'
          }}
        >
                     {React.Children.map(children, (child) => {
             if (React.isValidElement(child) && child.type === 'option') {
               const optionValue = (child.props as any).value;
               const optionText = (child.props as any).children;
               
               return (
                 <div
                   key={optionValue}
                   onClick={() => handleOptionClick(optionValue)}
                   className="px-4 py-3 hover:bg-cyan-50 cursor-pointer text-left text-gray-900 border-b border-gray-100 last:border-b-0"
                   style={{ 
                     pointerEvents: 'auto'
                   }}
                 >
                   {optionText}
                 </div>
               );
             }
             return null;
           })}
        </div>
      )}
      
      {/* Hidden select for form submission */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="sr-only"
      >
        {children}
      </select>
    </div>
  );
} 