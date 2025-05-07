import React from 'react'
import { cn } from '@/utils/cn'

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'subtitle1' | 'subtitle2' | 'caption'
  component?: React.ElementType
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive'
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  component,
  color = 'default',
  className,
  children,
  ...props
}) => {
  const colorClassNames = {
    default: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    muted: 'text-muted-foreground',
    accent: 'text-accent-foreground',
    destructive: 'text-destructive'
  }

  const variantClassNames = {
    h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
    h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
    h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
    h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
    h5: 'scroll-m-20 text-lg font-semibold tracking-tight',
    h6: 'scroll-m-20 text-base font-semibold tracking-tight',
    body1: 'leading-7 [&:not(:first-child)]:mt-6',
    body2: 'text-sm leading-5',
    subtitle1: 'text-base font-medium',
    subtitle2: 'text-sm font-medium',
    caption: 'text-xs'
  }

  const Component =
    component ||
    {
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
    <Component className={cn(variantClassNames[variant], colorClassNames[color], className)} {...props}>
      {children}
    </Component>
  )
}
