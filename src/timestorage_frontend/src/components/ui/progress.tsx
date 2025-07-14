import * as React from 'react'
import { cn } from '@/utils/cn'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The current progress value (0-100)
   * @default 0
   */
  value?: number
  /**
   * The maximum progress value
   * @default 100
   */
  max?: number
  /**
   * The color variant of the progress bar
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  /**
   * The size of the progress bar
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /**
   * If true, the progress bar will be indeterminate
   * @default false
   */
  indeterminate?: boolean
  /**
   * If true, the progress bar will show a label with the current percentage
   * @default false
   */
  showLabel?: boolean
  /**
   * Custom label format function
   */
  labelFormat?: (value: number, max: number) => string
}

/**
 * A customizable progress bar component built with DaisyUI
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    className,
    value = 0,
    max = 100,
    variant = 'primary',
    size = 'md',
    indeterminate = false,
    showLabel = false,
    labelFormat,
    ...props
  }, ref) => {
    // Ensure value is within bounds
    const progress = Math.max(0, Math.min(100, (value / max) * 100))
    
    // Variant classes
    const variantClasses = {
      primary: 'progress-primary',
      secondary: 'progress-secondary',
      accent: 'progress-accent',
      info: 'progress-info',
      success: 'progress-success',
      warning: 'progress-warning',
      error: 'progress-error'
    }

    // Size classes
    const sizeClasses = {
      xs: 'h-1',
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6'
    }

    // Default label formatter
    const formatLabel = labelFormat || ((val: number, max: number) => `${Math.round((val / max) * 100)}%`)

    return (
      <div className={cn('w-full flex flex-col gap-2', className)}>
        <div className="w-full flex justify-between text-xs text-base-content/70">
          {showLabel && <span>{formatLabel(value, max)}</span>}
          {showLabel && <span>{formatLabel(max, max)}</span>}
        </div>
        <div 
          ref={ref}
          className={cn(
            'progress w-full',
            variantClasses[variant],
            sizeClasses[size],
            indeterminate && 'progress-indeterminate',
            'overflow-hidden'
          )}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : progress}
          aria-valuemin={0}
          aria-valuemax={100}
          {...props}
        >
          {!indeterminate && (
            <div 
              className={cn(
                'h-full',
                'transition-all duration-300 ease-out',
                'flex items-center justify-end pr-2 text-xs text-white'
              )}
              style={{ width: `${progress}%` }}
            >
              {showLabel && <span className="text-white/80">{formatLabel(value, max)}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export { Progress }
