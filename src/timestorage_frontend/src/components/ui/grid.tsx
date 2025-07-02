import * as React from 'react'
import { cn } from '@/utils/cn'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If true, the grid will be a container (display: grid)
   * @default false
   */
  container?: boolean
  /**
   * If true, the grid will be a grid item
   * @default false
   */
  item?: boolean
  /**
   * The spacing between grid items (in rem units, 0-10)
   * @default 0
   */
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  /**
   * Number of columns for extra small screens (0-12 or 'auto')
   */
  xs?: number | 'auto' | boolean
  /**
   * Number of columns for small screens (0-12 or 'auto')
   */
  sm?: number | 'auto' | boolean
  /**
   * Number of columns for medium screens (0-12 or 'auto')
   */
  md?: number | 'auto' | boolean
  /**
   * Number of columns for large screens (0-12 or 'auto')
   */
  lg?: number | 'auto' | boolean
  /**
   * Number of columns for extra large screens (0-12 or 'auto')
   */
  xl?: number | 'auto' | boolean
  /**
   * Number of columns for extra extra large screens (0-12 or 'auto')
   */
  '2xl'?: number | 'auto' | boolean
  /**
   * Grid template columns for the container
   * @example 'repeat(3, minmax(0, 1fr))'
   */
  templateColumns?: string
  /**
   * Grid template rows for the container
   * @example 'repeat(2, minmax(0, 1fr))'
   */
  templateRows?: string
  /**
   * Align items in the grid container
   * @default 'start'
   */
  alignItems?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  /**
   * Justify items in the grid container
   * @default 'start'
   */
  justifyItems?: 'start' | 'end' | 'center' | 'stretch'
  /**
   * Align content in the grid container
   */
  alignContent?: 'start' | 'end' | 'center' | 'stretch' | 'between' | 'around' | 'evenly'
  /**
   * Justify content in the grid container
   */
  justifyContent?: 'start' | 'end' | 'center' | 'stretch' | 'between' | 'around' | 'evenly'
  /**
   * Auto flow for the grid container
   * @default 'row'
   */
  autoFlow?: 'row' | 'col' | 'row-dense' | 'col-dense'
}

/**
 * A responsive grid component built with Tailwind CSS and DaisyUI
 */
const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({
    className,
    container = false,
    item = false,
    spacing = 0,
    xs,
    sm,
    md,
    lg,
    xl,
    '2xl': twoXl,
    templateColumns,
    templateRows,
    alignItems = 'start',
    justifyItems = 'start',
    alignContent,
    justifyContent,
    autoFlow = 'row',
    children,
    style,
    ...props
  }, ref) => {
    // Generate responsive column classes
    const getColClass = (breakpoint: string, value: number | 'auto' | boolean | undefined) => {
      if (value === undefined) return ''
      if (value === 'auto' || value === true) return `${breakpoint ? `${breakpoint}:` : ''}col-auto`
      if (typeof value === 'number' && value >= 0 && value <= 12) {
        return `${breakpoint ? `${breakpoint}:` : ''}col-span-${value}`
      }
      return ''
    }

    // Generate gap class based on spacing prop
    const getGapClass = (gap: number) => {
      const gapMap = {
        0: 'gap-0',
        1: 'gap-1',
        2: 'gap-2',
        3: 'gap-3',
        4: 'gap-4',
        5: 'gap-5',
        6: 'gap-6',
        7: 'gap-7',
        8: 'gap-8',
        9: 'gap-9',
        10: 'gap-10'
      }
      return gapMap[gap as keyof typeof gapMap] || ''
    }

    // Generate auto-flow class
    const getAutoFlowClass = (flow: string) => {
      const flowMap: Record<string, string> = {
        'row': 'grid-flow-row',
        'col': 'grid-flow-col',
        'row-dense': 'grid-flow-row-dense',
        'col-dense': 'grid-flow-col-dense'
      }
      return flowMap[flow] || ''
    }

    const baseClasses = ''
    const gapClass = container ? getGapClass(spacing) : ''
    const autoFlowClass = container ? getAutoFlowClass(autoFlow) : ''

    const classes = cn(
      baseClasses,
      {
        // Container styles
        'grid w-full': container,
        [gapClass]: container && spacing > 0,
        [autoFlowClass]: container,
        // Item styles
        'col-auto': item,
        // Alignment
        [`items-${alignItems}`]: container && alignItems,
        [`justify-items-${justifyItems}`]: container && justifyItems,
        [`content-${alignContent}`]: container && alignContent,
        [`justify-${justifyContent}`]: container && justifyContent,
        // Responsive column spans
        [getColClass('', xs)]: xs !== undefined,
        [getColClass('sm', sm)]: sm !== undefined,
        [getColClass('md', md)]: md !== undefined,
        [getColClass('lg', lg)]: lg !== undefined,
        [getColClass('xl', xl)]: xl !== undefined,
        [getColClass('2xl', twoXl)]: twoXl !== undefined
      },
      className
    )

    const inlineStyles = {
      ...style,
      ...(templateColumns && { '--tw-grid-cols': templateColumns }),
      ...(templateRows && { '--tw-grid-rows': templateRows })
    } as React.CSSProperties

    return (
      <div
        ref={ref}
        className={classes}
        style={Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Grid.displayName = 'Grid'

export { Grid }
