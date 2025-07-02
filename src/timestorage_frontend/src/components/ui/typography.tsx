import React from 'react'
import { cn } from '@/utils/cn'

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The typography variant to use
   * @default 'body1'
   */
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'subtitle1' | 'subtitle2' | 'caption'
  
  /**
   * The HTML element to render as
   * If not provided, it will be inferred from the variant
   */
  component?: React.ElementType
  
  /**
   * The color variant to use
   * @default 'default'
   */
  color?: 'default' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'neutral'
  
  /**
   * If true, the text will be bold
   * @default false
   */
  bold?: boolean
  
  /**
   * If true, the text will be italic
   * @default false
   */
  italic?: boolean
  
  /**
   * If true, the text will be underlined
   * @default false
   */
  underline?: boolean
  
  /**
   * The text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right' | 'justify'
  
  /**
   * If true, the text will be truncated with an ellipsis
   * @default false
   */
  truncate?: boolean
}

/**
 * A flexible typography component that uses DaisyUI's utility classes
 */
export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  component,
  color = 'default',
  bold = false,
  italic = false,
  underline = false,
  align = 'left',
  truncate = false,
  className,
  children,
  ...props
}) => {
  // Color classes
  const colorClasses = {
    default: '',
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    ghost: 'text-neutral-content/70',
    neutral: 'text-neutral'
  }

  // Variant classes using DaisyUI's typography utilities
  const variantClasses = {
    h1: 'text-4xl md:text-5xl font-bold',
    h2: 'text-3xl md:text-4xl font-bold',
    h3: 'text-2xl md:text-3xl font-bold',
    h4: 'text-xl md:text-2xl font-semibold',
    h5: 'text-lg md:text-xl font-semibold',
    h6: 'text-base md:text-lg font-semibold',
    body1: 'text-base',
    body2: 'text-sm',
    subtitle1: 'text-lg font-medium opacity-90',
    subtitle2: 'text-base font-medium opacity-80',
    caption: 'text-xs opacity-70'
  }

  // Alignment classes
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  }

  // Determine the component to render
  const Component = component || {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    body1: 'p',
    body2: 'p',
    subtitle1: 'p',
    subtitle2: 'p',
    caption: 'span'
  }[variant]

  return (
    <Component
      className={cn(
        'leading-relaxed',
        variantClasses[variant],
        color !== 'default' && colorClasses[color],
        bold && 'font-bold',
        italic && 'italic',
        underline && 'underline',
        alignClasses[align],
        truncate && 'truncate',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
