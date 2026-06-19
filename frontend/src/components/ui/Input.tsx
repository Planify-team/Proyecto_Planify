import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  rightElement?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText && !error ? `${inputId}-helper` : undefined

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-600">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={errorId ?? helperId}
            className={`block w-full rounded-lg border px-3 py-2 text-sm transition-all placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 ${
              rightElement ? 'pr-10' : ''
            } ${
              error ? 'border-red-500/50 bg-red-500/10' : 'border-gray-200 bg-gray-100'
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p id={errorId} role="alert" className="text-xs text-red-400">{error}</p>}
        {helperText && !error && <p id={helperId} className="text-xs text-gray-500">{helperText}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
