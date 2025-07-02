import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

type AnimationState = 'initial' | 'animate' | 'exit'

type MotionVariant = {
  className?: string
  style?: React.CSSProperties
}

type MotionVariants = {
  [key in AnimationState]?: MotionVariant
}

// DaisyUI animation classes mapped to variants
export const fadeIn: MotionVariants = {
  initial: { className: 'opacity-0' },
  animate: { className: 'opacity-100 transition-opacity duration-300' },
  exit: { className: 'opacity-0 transition-opacity duration-300' }
}

export const slideUp: MotionVariants = {
  initial: { className: 'opacity-0 translate-y-4' },
  animate: { className: 'opacity-100 translate-y-0 transition-all duration-300' },
  exit: { className: 'opacity-0 translate-y-4 transition-all duration-300' }
}

export const slideDown: MotionVariants = {
  initial: { className: 'opacity-0 -translate-y-4' },
  animate: { className: 'opacity-100 translate-y-0 transition-all duration-300' },
  exit: { className: 'opacity-0 -translate-y-4 transition-all duration-300' }
}

export const slideInLeft: MotionVariants = {
  initial: { className: 'opacity-0 -translate-x-4' },
  animate: { className: 'opacity-100 translate-x-0 transition-all duration-300' },
  exit: { className: 'opacity-0 -translate-x-4 transition-all duration-300' }
}

export const slideInRight: MotionVariants = {
  initial: { className: 'opacity-0 translate-x-4' },
  animate: { className: 'opacity-100 translate-x-0 transition-all duration-300' },
  exit: { className: 'opacity-0 translate-x-4 transition-all duration-300' }
}

export const scale: MotionVariants = {
  initial: { className: 'opacity-0 scale-95' },
  animate: { className: 'opacity-100 scale-100 transition-all duration-300' },
  exit: { className: 'opacity-0 scale-95 transition-all duration-300' }
}

interface MotionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The animation variant to use
   * @default 'fadeIn'
   */
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideInLeft' | 'slideInRight' | 'scale'
  
  /**
   * Delay before animation starts (in milliseconds)
   * @default 0
   */
  delay?: number
  
  /**
   * Animation duration (in seconds)
   * @default 0.3
   */
  duration?: number
  
  /**
   * Whether to show the component initially (for enter/exit animations)
   * @default true
   */
  show?: boolean
  
  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void
  
  /**
   * Custom animation variants
   */
  variants?: MotionVariants
}

/**
 * A lightweight animation component that uses CSS transitions
 * instead of Framer Motion for better performance with DaisyUI
 */
export const Motion: React.FC<MotionProps> = ({
  variant = 'fadeIn',
  delay = 0,
  duration = 0.3,
  show = true,
  className,
  children,
  style,
  onAnimationComplete,
  variants: customVariants,
  ...props
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>(show ? 'animate' : 'initial')
  const [isMounted, setIsMounted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const animationDuration = duration * 1000 // Convert to ms
  
  // Define variants - use custom if provided, otherwise use built-in
  const variants = customVariants || {
    fadeIn,
    slideUp,
    slideDown,
    slideInLeft,
    slideInRight,
    scale
  }[variant] || fadeIn
  
  // Handle mount/unmount with animations
  useEffect(() => {
    if (!isMounted) {
      // Initial mount
      setIsMounted(true)
      if (show) {
        setAnimationState('animate')
      }
      return
    }
    
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (show) {
      // Enter animation
      setAnimationState('animate')
    } else {
      // Exit animation
      setAnimationState('exit')
      
      // Wait for exit animation to complete before calling onAnimationComplete
      timeoutRef.current = setTimeout(() => {
        setAnimationState('initial')
        onAnimationComplete?.()
      }, animationDuration + delay)
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [show, animationDuration, delay, onAnimationComplete, isMounted])
  
  // Don't render if we're in the initial hidden state
  if (!isMounted && !show) {
    return null
  }
  
  // Get the current variant based on animation state
  const currentVariant = variants[animationState] || {}
  const variantClasses = currentVariant?.className || ''
  const variantStyles = currentVariant?.style || {}
  
  // Apply transition delay
  const transitionDelay = delay ? { transitionDelay: `${delay}ms` } : {}
  
  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        variantClasses,
        className
      )}
      style={{
        ...variantStyles,
        ...transitionDelay,
        ...style,
        // Apply duration directly to the element if needed
        ...(duration ? { '--animation-duration': `${duration}s` } : {})
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Re-export a motion object for compatibility with existing code
export const motion = {
  div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
    <div ref={ref} {...props} />
  )),
  // Add other HTML elements as needed
  span: React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>((props, ref) => (
    <span ref={ref} {...props} />
  )),
  button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => (
    <button ref={ref} {...props} />
  )),
  // Add more elements as needed
}

// Export types for better type checking
export type { MotionVariants, MotionVariant, AnimationState }
