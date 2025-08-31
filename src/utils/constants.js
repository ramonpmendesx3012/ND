// Constantes da aplicação ND Express

// Categorias de despesas
export const EXPENSE_CATEGORIES = {
  ALIMENTACAO: 'Alimentação',
  DESLOCAMENTO: 'Deslocamento',
  HOSPEDAGEM: 'Hospedagem',
  OUTROS: 'Outros'
};

// Lista de categorias para select
export const CATEGORY_OPTIONS = Object.values(EXPENSE_CATEGORIES);

// Regras de teto por categoria (em R$)
export const CATEGORY_LIMITS = {
  CAFE_MANHA: 30.00,
  ALMOCO: 60.00,
  JANTAR: 60.00,
  ALIMENTACAO_GERAL: 60.00
};

// Horários para categorização automática
export const TIME_CATEGORIES = {
  CAFE_MANHA: { start: '00:00', end: '10:30' },
  ALMOCO: { start: '10:30', end: '15:00' },
  JANTAR: { start: '15:00', end: '23:59' }
};

// Configurações de arquivo
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp']
};

// Configurações de validação
export const VALIDATION = {
  MAX_DESCRIPTION_LENGTH: 100,
  MAX_VALUE: 999999,
  MIN_VALUE: 0.01
};

// Status de ND
export const ND_STATUS = {
  ABERTA: 'aberta',
  FECHADA: 'fechada'
};

// Tipos de notificação
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

// Mapeamento removido - estabelecimento não é mais usado

// Palavras-chave para categorização automática
export const CATEGORY_KEYWORDS = {
  [EXPENSE_CATEGORIES.ALIMENTACAO]: [
    'restaurante', 'lanchonete', 'padaria', 'café', 'bar',
    'refeição', 'almoço', 'jantar', 'café da manhã',
    'food', 'meal', 'breakfast', 'lunch', 'dinner'
  ],
  [EXPENSE_CATEGORIES.DESLOCAMENTO]: [
    'uber', 'taxi', '99', 'transporte', 'passagem',
    'combustível', 'gasolina', 'pedágio', 'estacionamento',
    'transport', 'fuel', 'parking', 'toll'
  ],
  [EXPENSE_CATEGORIES.HOSPEDAGEM]: [
    'hotel', 'pousada', 'hospedagem', 'diária',
    'accommodation', 'lodging', 'stay'
  ]
};

export default {
  EXPENSE_CATEGORIES,
  CATEGORY_OPTIONS,
  CATEGORY_LIMITS,
  TIME_CATEGORIES,
  FILE_CONFIG,
  VALIDATION,
  ND_STATUS,
  NOTIFICATION_TYPES,
  CATEGORY_KEYWORDS
};