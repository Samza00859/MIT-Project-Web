import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    required?: boolean;
}

const UnderlineInput: React.FC<InputProps> = ({ label, required, ...props }) => {
    return (
        <div className="mb-6 w-full">
            <label className="block text-xs font-bold text-gray-800 mb-2">
                {label}{required && <span className="text-red-500">*</span>}
            </label>
            <input
                className="w-full bg-transparent border-b border-gray-400 text-gray-800 py-1 focus:outline-none focus:border-black transition-colors"
                {...props}
            />
        </div>
    );
};

export default UnderlineInput;