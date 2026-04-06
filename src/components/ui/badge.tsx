import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[#002446] text-white',
        primary: 'bg-[#1a61a6] text-white',
        secondary: 'bg-slate-100 text-slate-700',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        error: 'bg-red-100 text-red-700',
        outline: 'border border-slate-200 text-slate-700',
        // Strategy badges
        dpo: 'bg-blue-100 text-blue-700',
        pdv: 'bg-purple-100 text-purple-700',
        judicial: 'bg-red-100 text-red-700',
        extrajudicial: 'bg-slate-100 text-slate-600',
        // Probability badges
        deals: 'bg-blue-600 text-white',
        focus: 'bg-amber-500 text-white',
        pre_pipe: 'bg-slate-400 text-white',
        firmada: 'bg-emerald-600 text-white',
        cancelled: 'bg-gray-100 text-gray-400',
        // Call result badges
        cup: 'bg-emerald-100 text-emerald-700',
        cun: 'bg-red-100 text-red-700',
        not_answering: 'bg-slate-100 text-slate-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
