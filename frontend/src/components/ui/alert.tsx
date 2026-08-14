import { AlertCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground",
        destructive:
          "border-destructive/50 text-destructive bg-destructive/10 dark:border-destructive [&_svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  )
}

function AlertIcon({ className }: { className?: string }) {
  return <AlertCircle className={cn("size-4 shrink-0", className)} />
}

export { Alert, AlertIcon }
