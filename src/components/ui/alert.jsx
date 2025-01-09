import { cn } from "../../lib/utils"
 
const Alert = ({
  variant = "default",
  className,
  ...props
}) => (
  <div
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4",
      {
        "bg-background text-foreground": variant === "default",
        "bg-destructive text-destructive-foreground": variant === "destructive",
      },
      className
    )}
    {...props}
  />
)
 
const AlertTitle = ({
  className,
  ...props
}) => (
  <h5
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
)
 
const AlertDescription = ({
  className,
  ...props
}) => (
  <div
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
)
 
export { Alert, AlertTitle, AlertDescription }