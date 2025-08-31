// Utilitário para formatação de moeda brasileira

/**
 * Formata um valor numérico para o formato de moeda brasileira
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado como R$ 0,00
 */
export function formatCurrency(value) {
  // Garantir que o valor seja numérico
  const numValue = parseFloat(value) || 0;

  // Formatação brasileira com SEMPRE duas casas decimais
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Converte string de moeda brasileira para número
 * @param {string} currencyString - String no formato "R$ 1.234,56"
 * @returns {number} Valor numérico
 */
export function parseCurrency(currencyString) {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove símbolos e converte vírgula para ponto
  const cleanValue = currencyString
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  return parseFloat(cleanValue) || 0;
}

/**
 * Formata valor para input (sem símbolo R$)
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado como 1234,56
 */
export function formatCurrencyInput(value) {
  const numValue = parseFloat(value) || 0;
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default formatCurrency;