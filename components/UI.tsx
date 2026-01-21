import React, { ReactNode } from 'react';

export const Label: React.FC<{ children?: ReactNode; title?: string }> = ({ children, title }) => (
  <label className="block text-sm font-medium text-gray-300" title={title}>
    {children}
  </label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm h-10 px-3 ${props.className || ''}`}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={`mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm h-10 px-3 ${props.className || ''}`}
  />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={`mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-3 ${props.className || ''}`}
  />
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }> = ({ variant = 'primary', className, ...props }) => {
  const baseClass = "font-medium py-2 px-4 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
  };
  return (
    <button {...props} className={`${baseClass} ${variants[variant]} ${className || ''}`} />
  );
};

export const Card: React.FC<{ children?: ReactNode; title: ReactNode; onRemove?: () => void; onEdit?: () => void }> = ({ children, title, onRemove, onEdit }) => (
  <div className="p-3 bg-gray-700 rounded-md relative group">
    <div className="flex justify-between items-center mb-2">
      <span className="font-medium text-white">{title}</span>
      <div className="flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
            <button 
                onClick={onEdit}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-medium"
            >
            Edit
            </button>
        )}
        {onRemove && (
            <button 
                onClick={onRemove}
                className="text-red-400 hover:text-red-300 text-xs font-medium"
            >
            Remove
            </button>
        )}
      </div>
    </div>
    {children}
  </div>
);

export const TabButton: React.FC<{ active: boolean; children?: ReactNode; onClick: () => void }> = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
      active
        ? 'text-cyan-400 border-cyan-500'
        : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
    }`}
  >
    {children}
  </button>
);