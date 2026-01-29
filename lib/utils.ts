import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatChainTimestamp(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
export const LAYOUT = {
  NODE_WIDTH: 340,
  NODE_HEIGHT: 200,

  HORIZONTAL_GAP: 160, // 
  VERTICAL_GAP: 200,   // 

  START_X: 0,
  START_Y: 0,
};

export function getNodePosition({
  chainIndex,
  depth,
}: {
  chainIndex: number;
  depth: number;
}) {
  return {
    x:
      LAYOUT.START_X +
      depth * (LAYOUT.NODE_WIDTH + LAYOUT.HORIZONTAL_GAP),

    y:
      LAYOUT.START_Y +
      chainIndex * (LAYOUT.NODE_HEIGHT + LAYOUT.VERTICAL_GAP),
  };
}
