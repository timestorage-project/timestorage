import * as React from 'react'
import { cn } from '@/utils/cn'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * The variant of the checkbox
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info'
  /**
   * The size of the checkbox
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /**
   * If true, the checkbox will be disabled
   */
  disabled?: boolean
  /**
   * If true, the checkbox will be in an indeterminate state
   */
  indeterminate?: boolean
  /**
   * Additional class name for the checkbox container
   */
  containerClassName?: string
  /**
   * Label text for the checkbox
   */
  label?: React.ReactNode
}

/**
 * A customizable checkbox component built with DaisyUI
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    disabled = false,
    indeterminate = false,
    containerClassName,
    label,
    ...props
  }, ref) => {
    const variantClasses = {
      primary: 'checkbox-primary',
      secondary: 'checkbox-secondary',
      accent: 'checkbox-accent',
      success: 'checkbox-success',
      warning: 'checkbox-warning',
      error: 'checkbox-error',
      info: 'checkbox-info'
    }

    const sizeClasses = {
      xs: 'checkbox-xs',
      sm: 'checkbox-sm',
      md: 'checkbox-md',
      lg: 'checkbox-lg'
    }

    const baseClasses = 'checkbox'

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      {
        'opacity-50 cursor-not-allowed': disabled
      },
      className
    )

    const handleRef = (element: HTMLInputElement | null) => {
      if (element && indeterminate) {
        element.indeterminate = true
      }
      if (ref) {
        if (typeof ref === 'function') {
          ref(element)
        } else {
          ref.current = element
        }
      }
    }

    return (
      <div className={cn('form-control items-start', containerClassName)}>
        <label className='label cursor-pointer gap-2 p-0'>
          <input
            type='checkbox'
            ref={handleRef}
            className={classes}
            disabled={disabled}
            {...props}
          />
          {label && <span className='label-text'>{label}</span>}
        </label>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
