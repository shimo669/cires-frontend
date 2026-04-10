import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
                                         children,
                                         variant = 'primary',
                                         isLoading,
                                         className,
                                         ...props
                                       }) => {
  const baseStyles =
    'flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  };

  return (
      <button
          className={`${baseStyles} ${variants[variant]} ${className}`}
          disabled={isLoading || props.disabled}
          {...props}
      >
        {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : children}
      </button>
  );
};

export default Button;