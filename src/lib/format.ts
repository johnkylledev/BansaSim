export function formatNumber(n: number, digits = 2) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPhpBillionsFromTrillions(trillions: number) {
  return `₱${Math.round(trillions * 1000).toLocaleString()} Billion`;
}

