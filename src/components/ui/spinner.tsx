import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl" | "custom"
  speed?: "normal" | "fast" | "faster"
}

function Spinner({ className, size = "sm", speed = "fast", style, ...props }: SpinnerProps) {
  const speedClasses = {
    normal: "animate-[spin_1.2s_linear_infinite]",
    fast: "animate-[spin_0.8s_linear_infinite]",
    faster: "animate-[spin_0.5s_linear_infinite]",
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "relative rounded-full flex items-center justify-center overflow-hidden",
        size !== "custom" && (size === "sm" ? "size-4" : size === "md" ? "size-8" : size === "lg" ? "size-12" : size === "xl" ? "size-20" : ""),
        speedClasses[speed],
        className
      )}
      style={style}
      {...props}
    >
      {/* The gradient ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, var(--color-primary), transparent)`
        }}
      />
      {/* The inner hole to create the ring effect */}
      <div
        className={cn(
          "absolute rounded-full bg-background",
          size === "sm" ? "inset-[1.5px]" : size === "md" ? "inset-[2.5px]" : size === "lg" ? "inset-[3.5px]" : size === "xl" ? "inset-[5px]" : "inset-[10%]"
        )}
      />
    </div>
  )
}

export { Spinner }
