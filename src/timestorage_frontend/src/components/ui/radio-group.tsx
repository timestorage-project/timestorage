import * as React from 'react'
import { cn } from '@/utils/cn'

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  disabled?: boolean
  name?: string
  orientation?: 'horizontal' | 'vertical'
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ 
    className, 
    value: valueProp, 
    onValueChange, 
    defaultValue, 
    disabled = false,
    name,
    orientation = 'vertical',
    children,
    ...props 
  }, ref) => {
    const [value, setValue] = React.useState(defaultValue || '')
    const currentValue = valueProp !== undefined ? valueProp : value

    const handleChange = (newValue: string) => {
      if (valueProp === undefined) {
        setValue(newValue)
      }
      onValueChange?.(newValue)
    }

    return (
      <div 
        ref={ref}
        className={cn(
          'flex gap-4',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
          className
        )}
        role='radiogroup'
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === RadioGroupItem) {
            return React.cloneElement(child as React.ReactElement, {
              checked: child.props.value === currentValue,
              disabled: disabled || child.props.disabled,
              name,
              onCheckedChange: () => handleChange(child.props.value)
            })
          }
          return child
        })}
      </div>
    )
  }
)
RadioGroup.displayName = 'RadioGroup'

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  id?: string
  disabled?: boolean
  className?: string
  children?: React.ReactNode
  onCheckedChange?: (checked: boolean) => void
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, children, id, value, disabled, checked, onCheckedChange, ...props }, ref) => {
    const inputId = id || `radio-${value}`
    
    return (
      <div className='flex items-center gap-2'>
        <input
          ref={ref}
          type='radio'
          id={inputId}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => onCheckedChange?.(!checked)}
          className={cn(
            'radio radio-primary',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {children && (
          <label 
            htmlFor={inputId} 
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {children}
          </label>
        )}
      </div>
    )
  }
)
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
