import { cn } from '@/lib/utils'

interface SpinnerProps extends React.ComponentProps<'svg'> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  speed?: 'normal' | 'fast' | 'faster'
}

function Spinner({ className, size = 'sm', speed = 'fast', ...props }: SpinnerProps) {
  const speedClasses = {
    normal: 'animate-spin duration-[1.2s]',
    fast: 'animate-spin duration-[0.8s]',
    faster: 'animate-spin duration-[0.5s]',
  }

  const sizeClasses = {
    sm: 'size-4',
    md: 'size-8',
    lg: 'size-12',
    xl: 'size-20',
    custom: '',
  }

  return (
    <svg
      role="status"
      aria-label="Loading"
      className={cn(speedClasses[speed], sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Background circle (faded) */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      {/* Spinning arc */}
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export { Spinner }
