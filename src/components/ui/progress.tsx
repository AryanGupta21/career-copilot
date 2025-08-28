// /Users/aryangupta/Developer/iexcel-career-tool/src/components/ui/progress.tsx

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-blue-600 transition-all duration-500 ease-out"
        style={{ transform: `translateX(-${100 - (value / max) * 100}%)` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }