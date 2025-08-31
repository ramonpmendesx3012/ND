// Utilitários para categorização automática de despesas
import { EXPENSE_CATEGORIES, CATEGORY_KEYWORDS, TIME_CATEGORIES } from './constants.js';

/**
 * Categoriza automaticamente uma despesa baseada na descrição e horário
 * @param {string} description - Descrição da despesa
 * @param {string} time - Horário da despesa (HH:MM)
 * @returns {string} Categoria sugerida
 */
export function categorizeExpenseAutomatically(description, time) {
  if (!description) return EXPENSE_CATEGORIES.OUTROS;
  
  const descriptionLower = description.toLowerCase();
  
  // Primeiro, tentar categorizar por palavras-chave
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (descriptionLower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  // Se não encontrou por palavras-chave e tem horário, tentar por TIME_CATEGORIES
  if (time) {
    const timeFormatted = time.padStart(5, '0'); // Garantir formato HH:MM
    
    for (const [timeCategory, timeRange] of Object.entries(TIME_CATEGORIES)) {
      if (isTimeInRange(timeFormatted, timeRange.start, timeRange.end)) {
        // Se está no horário de alimentação, retornar Alimentação
        return EXPENSE_CATEGORIES.ALIMENTACAO;
      }
    }
  }
  
  // Fallback para categoria padrão
  return EXPENSE_CATEGORIES.OUTROS;
}

/**
 * Verifica se um horário está dentro de um intervalo
 * @param {string} time - Horário a verificar (HH:MM)
 * @param {string} start - Horário de início (HH:MM)
 * @param {string} end - Horário de fim (HH:MM)
 * @returns {boolean} True se está no intervalo
 */
export function isTimeInRange(time, start, end) {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

/**
 * Converte horário HH:MM para minutos
 * @param {string} time - Horário no formato HH:MM
 * @returns {number} Minutos desde 00:00
 */
export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Extrai horário de uma descrição usando regex
 * @param {string} description - Descrição da despesa
 * @returns {string|null} Horário extraído no formato HH:MM ou null
 */
export function extractTimeFromDescription(description) {
  if (!description) return null;
  
  // Regex para capturar horários em diferentes formatos
  const timePatterns = [
    /\b([0-1]?[0-9]|2[0-3])[:h]([0-5][0-9])\b/, // 14:30 ou 14h30
    /\b([0-1]?[0-9]|2[0-3])[:.]([0-5][0-9])\b/, // 14:30 ou 14.30
    /\b([0-1]?[0-9]|2[0-3])h([0-5][0-9])\b/,    // 14h30
  ];
  
  for (const pattern of timePatterns) {
    const match = description.match(pattern);
    if (match) {
      const hours = match[1].padStart(2, '0');
      const minutes = match[2];
      return `${hours}:${minutes}`;
    }
  }
  
  return null;
}

/**
 * Sugere categoria baseada na descrição e horário atual
 * @param {string} description - Descrição da despesa
 * @param {string} aiCategory - Categoria sugerida pela IA (opcional)
 * @returns {string} Categoria final sugerida
 */
export function suggestCategory(description, aiCategory = null) {
  if (!description) return aiCategory || EXPENSE_CATEGORIES.OUTROS;
  
  // Extrair horário da descrição ou usar horário atual
  const extractedTime = extractTimeFromDescription(description);
  const timeToUse = extractedTime || new Date().toTimeString().slice(0, 5);
  
  const autoCategory = categorizeExpenseAutomatically(description, timeToUse);
  
  // Usar categoria automática se não foi fornecida pela IA ou se a automática for mais específica
  if (!aiCategory || autoCategory !== EXPENSE_CATEGORIES.OUTROS) {
    return autoCategory;
  }
  
  return aiCategory;
}

/**
 * Calcula score de confiança da categorização
 * @param {string} description - Descrição da despesa
 * @param {string} category - Categoria sugerida
 * @returns {number} Score de 0 a 100
 */
export function calculateCategorizationConfidence(description, category) {
  if (!description || !category) return 0;
  
  const descriptionLower = description.toLowerCase();
  const keywords = CATEGORY_KEYWORDS[category] || [];
  
  let matchCount = 0;
  let totalKeywords = keywords.length;
  
  for (const keyword of keywords) {
    if (descriptionLower.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }
  
  // Score baseado na proporção de palavras-chave encontradas
  const keywordScore = totalKeywords > 0 ? (matchCount / totalKeywords) * 100 : 0;
  
  // Bonus se a categoria não for "Outros"
  const categoryBonus = category !== EXPENSE_CATEGORIES.OUTROS ? 20 : 0;
  
  return Math.min(100, Math.round(keywordScore + categoryBonus));
}

export default {
  categorizeExpenseAutomatically,
  isTimeInRange,
  timeToMinutes,
  extractTimeFromDescription,
  suggestCategory,
  calculateCategorizationConfidence
};