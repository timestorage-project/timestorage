import * as React from 'react'
import { cn } from '@/utils/cn'

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  
  /**
   * Color variant of the spinner
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'neutral'
  
  /**
   * Type of spinner
   * @default 'spinner'
   */
  type?: 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity'
}

/**
 * A loading spinner component using DaisyUI's loading utilities
 */
export function Spinner({ 
  className, 
  size = 'md', 
  variant = 'primary',
  type = 'spinner',
  ...props 
}: SpinnerProps) {
  const sizeClasses = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  }
  
  const variantClass = variant ? `text-${variant}` : ''
  const typeClass = type === 'spinner' ? 'loading-spinner' : `loading-${type}`
  
  return (
    <span 
      className={cn(
        'loading',
        typeClass,
        sizeClasses[size],
        variantClass,
        className
      )} 
      {...props} 
    />
  )
}
