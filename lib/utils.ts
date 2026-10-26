import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge about the design-system utilities so `cn()` resolves conflicts correctly.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['heading-xl', 'heading-lg', 'heading-md', 'heading-sm', 'special-button-text', 'sm-medium-mono'] }],
      shadow: [{ shadow: ['focus', 'focus-destructive'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
