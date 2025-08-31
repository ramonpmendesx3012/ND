// Utilitário para formatação de datas

/**
 * Formata uma data para o formato brasileiro dd/mm/aaaa
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada como dd/mm/aaaa
 */
export function formatDate(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data para o formato de input HTML (yyyy-mm-dd)
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada como yyyy-mm-dd
 */
export function formatDateForInput(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toISOString().split('T')[0];
}

/**
 * Formata uma data para exibição com mês abreviado (dd/mmm/aaaa)
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada como dd/jan/aaaa
 */
export function formatDateWithMonth(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Converte string de data brasileira (dd/mm/aaaa) para Date
 * @param {string} dateString - String no formato dd/mm/aaaa
 * @returns {Date|null} Objeto Date ou null se inválido
 */
export function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return null;
  }
  
  const [day, month, year] = parts;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Obtém a data atual formatada para input HTML
 * @returns {string} Data atual no formato yyyy-mm-dd
 */
export function getCurrentDateForInput() {
  return formatDateForInput(new Date());
}

/**
 * Verifica se uma data é válida
 * @param {Date|string} date - Data a ser validada
 * @returns {boolean} True se a data for válida
 */
export function isValidDate(date) {
  if (!date) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return !isNaN(dateObj.getTime());
}

export default formatDate;