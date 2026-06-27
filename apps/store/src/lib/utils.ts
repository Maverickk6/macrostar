import { ClassValue, clsx } from "clsx"
import { any } from "zod";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNaira(amount: number | string): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(value);
}

export function getProductImageUrl(image: string | null | undefined, productName: string, apiURL?: string): string | null {
  const trimmedImage = image?.trim();
  if (trimmedImage) {
    if (trimmedImage.startsWith('/uploads') && apiURL) {
      return `${apiURL}${trimmedImage}`;
    }
    return trimmedImage;
  }
  return null; // Return null to indicate placeholder should be used
}
