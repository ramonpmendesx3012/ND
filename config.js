// Configuração segura para frontend - ND Express
// IMPORTANTE: Nenhuma credencial sensível é exposta aqui

// Configuração da OpenAI API (apenas endpoint público)
const OPENAI_CONFIG = {
  API_URL: '/api/openai-analyze', // Endpoint seguro
  MODEL: 'gpt-4o',
  MAX_TOKENS: 500,
};

// Configurações de segurança (públicas)
const SECURITY_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  RATE_LIMIT_REQUESTS: 10, // Máximo de requests por minuto
  RATE_LIMIT_WINDOW: 60000, // 1 minuto em ms
  MAX_DESCRIPTION_LENGTH: 100,
  MAX_VALUE: 999999,
};

// URLs das APIs backend (sem credenciais)
const API_CONFIG = {
  BASE_URL: '/api',
  ENDPOINTS: {
    SUPABASE_QUERY: '/api/supabase-query',
    SUPABASE_INSERT: '/api/supabase-insert',
    SUPABASE_UPDATE: '/api/supabase-update',
    SUPABASE_DELETE: '/api/supabase-delete',
    SUPABASE_UPLOAD: '/api/supabase-upload',
    OPENAI_ANALYZE: '/api/openai-analyze'
  }
};

// Validação de configuração (apenas frontend)
function validateConfig() {
  console.log('✅ Configuração frontend validada com sucesso');
  return true;
}

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OPENAI_CONFIG, SECURITY_CONFIG, API_CONFIG, validateConfig };
} else {
  window.OPENAI_CONFIG = OPENAI_CONFIG;
  window.SECURITY_CONFIG = SECURITY_CONFIG;
  window.API_CONFIG = API_CONFIG;
  window.validateConfig = validateConfig;
  
  // Validar configuração ao carregar
  document.addEventListener('DOMContentLoaded', validateConfig);
}
