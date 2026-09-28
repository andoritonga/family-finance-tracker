export function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function parseRupiah(s: string): number {
  const cleanStr = s.replace(/[^0-9,-]+/g, "").replace(/,/g, ".");
  return parseFloat(cleanStr) || 0;
}
