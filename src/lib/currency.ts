/**
 * Central currency formatting function based on the user's preferred currency.
 * 
 * @param value The numeric value to format
 * @param moeda The user's preferred currency ("Real", "Euro", "Dólar"/"Dolar")
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | null | undefined, moeda: string | null | undefined): string {
  const numericValue = Number(value || 0);
  const normalizedMoeda = (moeda || "Real").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normalizedMoeda === "euro") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "EUR"
    }).format(numericValue);
  }

  if (normalizedMoeda === "dolar") {
    // Custom format for "US$ 1.250,00" as requested
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
    return `US$ ${formatted}`;
  }

  // Default to Real (BRL)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numericValue);
}

/**
 * Returns the currency symbol based on the user's preferred currency.
 * Useful for prefixing inputs.
 */
export function getCurrencySymbol(moeda: string | null | undefined): string {
  const normalizedMoeda = (moeda || "Real").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normalizedMoeda === "euro") return "€";
  if (normalizedMoeda === "dolar") return "US$";
  return "R$";
}
