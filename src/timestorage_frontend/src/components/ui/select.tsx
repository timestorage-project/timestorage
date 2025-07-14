import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

// Re-export the native select element as a fallback
// Omit the native 'size' attribute to avoid conflict with our custom size prop
export interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * The variant of the select
   * @default 'bordered'
   */
  variant?: 'bordered' | 'ghost' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  /**
   * The size of the select
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /**
   * If true, the select will take up the full width of its container
   * @default false
   */
  fullWidth?: boolean
  /**
   * If true, the select will be disabled
   * @default false
   */
  disabled?: boolean
  /**
   * If true, the select will show a loading spinner
   * @default false
   */
  loading?: boolean
  /**
   * The placeholder text to show when no value is selected
   */
  placeholder?: string
  /**
   * The options to display in the select
   */
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  /**
   * Additional class name for the select wrapper
   */
  className?: string
  /**
   * Additional class name for the select element
   */
  selectClassName?: string
}

/**
 * A simple select component that uses the native HTML select element
 * with DaisyUI styling
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({
    className,
    variant = 'bordered',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    placeholder,
    options = [],
    children,
    ...props
  }, ref) => {
    // Variant classes
    const variantClasses = {
      bordered: 'select-bordered',
      ghost: 'select-ghost',
      primary: 'select-primary',
      secondary: 'select-secondary',
      accent: 'select-accent',
      info: 'select-info',
      success: 'select-success',
      warning: 'select-warning',
      error: 'select-error'
    }

    // Size classes
    const sizeClasses = {
      xs: 'select-xs',
      sm: 'select-sm',
      md: 'select-md',
      lg: 'select-lg'
    }

    // Width class
    const widthClass = fullWidth ? 'w-full' : ''

    // Disabled class
    const disabledClass = disabled || loading ? 'opacity-70 cursor-not-allowed' : ''

    return (
      <div className={cn('form-control w-full', widthClass, className)}>
        <select
          ref={ref}
          disabled={disabled || loading}
          className={cn(
            'select',
            'w-full',
            variantClasses[variant],
            sizeClasses[size],
            disabledClass,
            'transition-colors duration-200',
            'appearance-none',
            'pr-8', // Make room for the chevron
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <ChevronDown className="h-4 w-4 opacity-70" />
          )}
        </div>
      </div>
    )
  }
)

NativeSelect.displayName = 'NativeSelect'

// Re-export the native select as Select for compatibility
export const Select = NativeSelect

/**
 * A group of related select options
 */
export const SelectGroup = ({ children, ...props }: { 
  children: React.ReactNode 
  className?: string 
}) => (
  <div className="form-control w-full" {...props}>
    {children}
  </div>
)

SelectGroup.displayName = 'SelectGroup'

export const SelectValue = ({ children, ...props }: { children?: React.ReactNode }) => (
  <span {...props}>{children}</span>
)

SelectValue.displayName = 'SelectValue'

export const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('relative', className)} {...props}>
      {children}
    </div>
  )
)

SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = ({ children, ...props }: { children: React.ReactNode }) => (
  <div {...props} className="hidden">
    {children}
  </div>
)

SelectContent.displayName = 'SelectContent'

export const SelectLabel = ({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLLabelElement> & { 
  htmlFor?: string 
}) => (
  <label 
    className={cn('label', className)}
    {...props}
  />
)

SelectLabel.displayName = 'SelectLabel'

export const SelectItem = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, children, ...props }, ref) => (
    <option
      ref={ref}
      className={cn('px-4 py-2 hover:bg-base-200', className)}
      {...props}
    >
      {children}
    </option>
  )
)

SelectItem.displayName = 'SelectItem'

export const SelectSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-px bg-base-200 my-1', className)} {...props} />
)

SelectSeparator.displayName = 'SelectSeparator'

export const SelectScrollUpButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('hidden', className)} {...props} />
)

SelectScrollUpButton.displayName = 'SelectScrollUpButton'

export const SelectScrollDownButton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('hidden', className)} {...props} />
)

SelectScrollDownButton.displayName = 'SelectScrollDownButton'
