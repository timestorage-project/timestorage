import * as React from 'react'
import { cn } from '@/utils/cn'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * The visual style of the label
   * @default 'normal'
   */
  variant?: 'normal' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  /**
   * The size of the label
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /**
   * If true, the label will be disabled
   * @default false
   */
  disabled?: boolean
  /**
   * If true, the label will be required (shows an asterisk)
   * @default false
   */
  required?: boolean
  /**
   * The HTML for attribute for the label
   */
  htmlFor?: string
}

/**
 * A customizable label component built with DaisyUI
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({
    className,
    variant = 'normal',
    size = 'md',
    disabled = false,
    required = false,
    children,
    ...props
  }, ref) => {
    const variantClasses = {
      normal: '',
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error'
    }

    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }

    const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    const requiredClass = required ? "after:content-['*'] after:ml-0.5 after:text-error" : ''

    return (
      <label
        ref={ref}
        className={cn(
          'label',
          'font-medium',
          'leading-tight',
          'flex items-center',
          variantClasses[variant],
          sizeClasses[size],
          disabledClass,
          requiredClass,
          className
        )}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </label>
    )
  }
)

Label.displayName = 'Label'

export { Label }
