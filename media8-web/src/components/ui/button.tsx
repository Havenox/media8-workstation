import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-wine-light hover:shadow-lg active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 active:scale-[0.98]",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]",
        ghost: 
          "text-primary hover:bg-primary/10 active:scale-[0.98]",
        link: 
          "text-primary underline-offset-4 hover:underline",
        // Premium variants for Media 8
        premium:
          "bg-gradient-to-r from-wine-warm to-wine-vibrant text-primary-foreground shadow-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        "premium-outline":
          "border-2 border-wine-warm bg-transparent text-primary hover:border-wine-vibrant hover:shadow-glow active:scale-[0.98]",
        sidebar:
          "bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-start",
        "sidebar-active":
          "bg-sidebar-primary text-sidebar-primary-foreground justify-start",
      },
      size: {
        // Touch-friendly sizes: h-12 on mobile, h-10 on desktop
        default: "h-12 md:h-10 px-5 py-2",
        sm: "h-10 md:h-9 rounded-md px-4 text-xs",
        lg: "h-14 md:h-12 rounded-lg px-8 text-base",
        xl: "h-16 md:h-14 rounded-xl px-10 text-lg",
        icon: "h-12 w-12 md:h-10 md:w-10",
        "icon-sm": "h-10 w-10 md:h-8 md:w-8",
        "icon-lg": "h-14 w-14 md:h-12 md:w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
