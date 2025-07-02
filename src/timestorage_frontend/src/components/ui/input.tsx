import * as React from 'react'
import { cn } from '@/utils/cn'

// Omit the native size prop to avoid conflict with our custom size prop
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * The visual style of the input
   * @default 'bordered'
   */
  variant?: 'bordered' | 'ghost' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  /**
   * The size of the input
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /**
   * If true, the input will take up the full width of its container
   * @default false
   */
  fullWidth?: boolean
  /**
   * If true, the input will have a focus ring
   * @default true
   */
  focusRing?: boolean
  /**
   * If true, the input will have a border
   * @default true
   */
  bordered?: boolean
  /**
   * If true, the input will be disabled
   * @default false
   */
  disabled?: boolean
  /**
   * If true, the input will show a loading spinner
   * @default false
   */
  loading?: boolean
}

/**
 * A customizable input component built with DaisyUI
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = 'input',
      type = 'text',
      variant = 'bordered',
      size = 'md',
      fullWidth = false,
      focusRing = true,
      bordered = true,
      disabled = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'input'
    const variantClass = variant !== 'bordered' ? `input-${variant}` : ''
    const sizeClass = size !== 'md' ? `input-${size}` : ''
    const widthClass = fullWidth ? 'w-full' : ''
    const focusClass = focusRing ? 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50' : ''
    const borderClass = bordered ? 'border border-base-300' : 'border-0'
    const disabledClass = disabled ? 'cursor-not-allowed opacity-70' : ''
    const loadingClass = loading ? 'loading' : ''

    return (
      <div className={cn('relative', widthClass, { 'w-full': fullWidth })}>
        <input
          type={type}
          className={cn(
            baseClasses,
            variantClass,
            sizeClass,
            widthClass,
            focusClass,
            borderClass,
            disabledClass,
            loadingClass,
            'transition-colors duration-200',
            className
          )}
          disabled={disabled || loading}
          ref={ref}
          {...props}
        />
        {loading && (
          <span className='absolute right-3 top-1/2 -translate-y-1/2'>
            <span className='loading loading-spinner loading-xs'></span>
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
