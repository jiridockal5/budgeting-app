"use client";

interface AuthInputProps {
  id: string;
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  autoFocus?: boolean;
}

export function AuthInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required = true,
  autoFocus = false,
}: AuthInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-600"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        placeholder={placeholder}
      />
    </div>
  );
}

