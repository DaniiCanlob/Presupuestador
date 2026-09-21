import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...clases: ClassValue[]): string => twMerge(clsx(clases));
