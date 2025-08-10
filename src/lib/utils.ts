// ID format utility functions
let idCounter = 1;
const idMap = new Map<string, number>();

/**
 * Converts a long ID (like cuid) to a short sequential number for display
 * @param id - The original long ID
 * @returns Short sequential number (1, 2, 3, etc.)
 */
export function formatId(id: string): number {
  if (!idMap.has(id)) {
    idMap.set(id, idCounter++);
  }
  return idMap.get(id)!;
}

/**
 * Resets the ID counter (useful when switching pages or refreshing data)
 */
export function resetIdCounter(): void {
  idCounter = 1;
  idMap.clear();
}

/**
 * Formats order number for display
 * @param orderId - The original order ID
 * @returns Formatted order number like "Sifariş #123"
 */
export function formatOrderNumber(orderId: string): string {
  const shortId = formatId(orderId);
  return `Sifariş #${shortId}`;
}

/**
 * Formats product ID for display
 * @param productId - The original product ID
 * @returns Formatted product ID like "Məhsul #123"
 */
export function formatProductId(productId: string): string {
  const shortId = formatId(productId);
  return `Məhsul #${shortId}`;
}

/**
 * Formats category ID for display
 * @param categoryId - The original category ID
 * @returns Formatted category ID like "Kateqoriya #123"
 */
export function formatCategoryId(categoryId: string): string {
  const shortId = formatId(categoryId);
  return `Kateqoriya #${shortId}`;
}
