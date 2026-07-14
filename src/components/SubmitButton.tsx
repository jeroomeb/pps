'use client'

import { useFormStatus } from 'react-dom'
import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-container text-on-primary-container hover:brightness-95 disabled:opacity-60',
  secondary:
    'bg-transparent border-2 border-on-surface text-on-surface hover:bg-surface-container',
  danger: 'bg-error text-white hover:brightness-95 disabled:opacity-60',
}

export function SubmitButton({
  children,
  variant = 'primary',
  pendingText,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  pendingText?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      className={`min-h-12 rounded px-6 font-headline font-semibold uppercase tracking-wide text-sm transition ${variantClasses[variant]} ${className}`}
    >
      {pending ? (pendingText ?? 'Saving…') : children}
    </button>
  )
}
