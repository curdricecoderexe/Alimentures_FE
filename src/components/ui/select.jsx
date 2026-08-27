import React, { useState, useEffect } from 'react';

export function Select({ value, onValueChange, children, defaultValue }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value || defaultValue);

  useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const handleValueChange = (newVal) => {
    setInternalValue(newVal);
    if (onValueChange) onValueChange(newVal);
  };

  return (
    <div className="relative w-full">
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, {
          value: internalValue,
          onValueChange: handleValueChange,
          open,
          setOpen,
        }) : child
      )}
    </div>
  );
}

export function SelectTrigger({ children, open, setOpen, value }) {
  return (
    <div
      onClick={() => setOpen(!open)}
      className="h-12 px-4 rounded-xl bg-gray-50 flex justify-between items-center cursor-pointer group hover:bg-gray-100 transition-all border border-transparent"
    >
      {React.Children.map(children, (child) => 
        React.isValidElement(child) ? React.cloneElement(child, { value }) : child
      )}
      <span className={`text-[10px] text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▼</span>
    </div>
  );
}

export function SelectValue({ value, placeholder }) {
  const labels = { 
    grains: "Organic Grains", 
    spices: "Natural Spices", 
    snacks: "Healthy Snacks",
    customer: "Customer",
    admin: "Administrator",
    staff: "Staff Member",
    delivery: "Delivery Personnel"
  };
  
  const displayValue = labels[value] || (value ? value.charAt(0).toUpperCase() + value.slice(1) : null);
  return <span className="text-sm font-medium text-gray-700">{displayValue || placeholder || "Select Option"}</span>;
}

export function SelectContent({ children, open, setOpen, onValueChange }) {
  if (!open) return null;
  return (
    <div className="absolute top-full left-0 w-full bg-white border border-gray-100 mt-1 rounded-xl shadow-2xl z-[110] overflow-hidden">
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, {
          onSelect: (val) => {
            onValueChange(val);
            setOpen(false);
          },
        }) : child
      )}
    </div>
  );
}

export function SelectItem({ value, children, onSelect }) {
  return (
    <div onClick={() => onSelect(value)} className="p-3 text-sm font-medium text-gray-600 hover:bg-[#E83D6E]/5 hover:text-[#E83D6E] cursor-pointer transition-colors">
      {children}
    </div>
  );
}