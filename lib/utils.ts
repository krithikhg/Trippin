import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

//combines Tailwind class names together and removes conflicting ones
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
