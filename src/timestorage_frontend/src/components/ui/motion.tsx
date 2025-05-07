import React from 'react'
import { motion as framerMotion, type Variant } from 'framer-motion'
import { cn } from '@/utils/cn'

type MotionVariants = {
  initial: Variant
  animate: Variant
  exit?: Variant
}

export const fadeIn: MotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const slideUp: MotionVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 }
}

export const slideDown: MotionVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export const slideInLeft: MotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

export const slideInRight: MotionVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

export const scale: MotionVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

interface MotionProps {
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideInLeft' | 'slideInRight' | 'scale'
  delay?: number
  duration?: number
  className?: string
  children?: React.ReactNode
  // Use a more specific type for additional props
  style?: React.CSSProperties
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  [key: string]: unknown
}

export function Motion({ variant = 'fadeIn', delay = 0, duration = 0.3, className, children, ...props }: MotionProps) {
  const variants = {
    fadeIn,
    slideUp,
    slideDown,
    slideInLeft,
    slideInRight,
    scale
  }[variant]

  return (
    <framerMotion.div
      initial='initial'
      animate='animate'
      exit='exit'
      variants={variants}
      transition={{ duration, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </framerMotion.div>
  )
}

export const motion = framerMotion
