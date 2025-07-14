import React from 'react'
import { cn } from '@/utils/cn'
import { Info, Download, Wrench, Construction, FileText, CheckCircle, Play, type LucideProps } from 'lucide-react'

export interface IconProps extends LucideProps {
  name: string
  isWizard?: boolean
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(({ name, isWizard, className, ...props }, ref) => {
  const getIconComponent = (iconName: string, isWizard?: boolean) => {
    if (isWizard) return Play
    switch (iconName) {
      case 'info':
        return Info
      case 'download':
        return Download
      case 'build':
        return Wrench
      case 'construction':
        return Construction
      case 'description':
        return FileText
      case 'verified':
        return CheckCircle
      default:
        return Info
    }
  }

  const IconComponent = getIconComponent(name, isWizard)

  return <IconComponent ref={ref} className={cn('h-6 w-6', className)} {...props} />
})

Icon.displayName = 'Icon'

export { Icon }
