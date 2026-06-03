import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 backdrop-blur-sm will-change-transform [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-diplomatic-600 to-diplomatic-700 text-white ring-1 ring-white/10 shadow-lg shadow-diplomatic-900/20 hover:from-diplomatic-500 hover:to-diplomatic-700 hover:shadow-diplomatic-900/30 hover:-translate-y-0.5",
        secondary: "bg-neutral-100 text-diplomatic-800 hover:bg-neutral-200 border border-neutral-200 shadow-sm hover:shadow-md hover:-translate-y-0.5",
        accent: "bg-gradient-to-r from-gold-400 to-amber-400 text-diplomatic-900 ring-1 ring-white/10 shadow-lg shadow-amber-500/25 hover:from-gold-300 hover:to-amber-400 hover:shadow-amber-500/40 hover:-translate-y-0.5",
        outline: "border border-diplomatic-200 bg-white text-diplomatic-700 hover:bg-diplomatic-50 hover:border-diplomatic-300 shadow-sm hover:shadow-md hover:-translate-y-0.5",
        ghost: "text-diplomatic-700 hover:bg-diplomatic-50 hover:text-diplomatic-800",
        link: "text-diplomatic-600 underline-offset-4 hover:underline hover:text-diplomatic-700 p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  to?: string;
  external?: boolean;
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className, variant, size, to, external, ...props }, ref) => {
    // Handle anchor links (starts with #)
    if (to && to.startsWith('#')) {
      return (
        <a
          href={to}
          className={cn(buttonVariants({ variant, size, className }))}
          {...(props as any)}
        />
      );
    }
    // Handle external links
    if (to && external) {
      return (
        <a
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant, size, className }))}
          {...(props as any)}
        />
      );
    }
    // Handle internal links via React Router
    if (to) {
      return (
        <Link
          to={to}
          className={cn(buttonVariants({ variant, size, className }))}
          {...(props as any)}
        />
      );
    }
    // Default button
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

CustomButton.displayName = "CustomButton";

export { CustomButton, buttonVariants };
