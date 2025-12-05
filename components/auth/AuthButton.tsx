"use client";

interface AuthButtonProps {
  type?: "submit" | "button";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
}

export function AuthButton({
  type = "submit",
  onClick,
  disabled = false,
  loading = false,
  loadingText = "Processing...",
  variant = "primary",
  children,
  className = "",
}: AuthButtonProps) {
  const baseStyles =
    "w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const variantStyles =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-500"
      : "border border-slate-300 bg-white text-slate-900 hover:border-indigo-200";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

