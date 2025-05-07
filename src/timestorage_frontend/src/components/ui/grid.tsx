import * as React from 'react'
import { cn } from '@/utils/cn'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  container?: boolean
  item?: boolean
  spacing?: number
  xs?: number | 'auto' | boolean
  sm?: number | 'auto' | boolean
  md?: number | 'auto' | boolean
  lg?: number | 'auto' | boolean
  xl?: number | 'auto' | boolean
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, container, item, spacing = 0, xs, sm, md, lg, xl, children, ...props }, ref) => {
    const spacingClass = container ? `gap-${spacing}` : ''

    const getColClass = (breakpoint: string, value: number | 'auto' | boolean | undefined) => {
      if (value === undefined) return ''
      if (value === 'auto') return `${breakpoint}:col-auto`
      if (typeof value === 'boolean' && value) return `${breakpoint}:col-auto`
      if (typeof value === 'number') {
        // Convert 1-12 grid system to 12 column tailwind grid
        return `${breakpoint}:col-span-${value}`
      }
      return ''
    }

    return (
      <div
        ref={ref}
        className={cn(
          container && 'grid w-full',
          container && spacingClass,
          item && 'col-auto',
          // For xs, we don't need a breakpoint prefix as it's the default
          xs !== undefined && getColClass('', xs).replace(':', ''),
          sm !== undefined && getColClass('sm', sm),
          md !== undefined && getColClass('md', md),
          lg !== undefined && getColClass('lg', lg),
          xl !== undefined && getColClass('xl', xl),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Grid.displayName = 'Grid'

export { Grid }
