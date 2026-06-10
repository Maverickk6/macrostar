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

export function getProductImageUrl(image: string | null | undefined, productName: string, apiURL?: string): string {
  const trimmedImage = image?.trim();
  if (trimmedImage) {
    if (trimmedImage.startsWith('/uploads') && apiURL) {
      return `${apiURL}${trimmedImage}`;
    }
    return trimmedImage;
  }
  return `https://via.placeholder.com/600x600/334155/e2e8f0?text=${encodeURIComponent(productName.substring(0, 20))}`;
}
