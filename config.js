// ===== CONFIGURAÇÃO SEGURA - ND EXPRESS =====
// IMPORTANTE: Chaves de API foram movidas para serverless functions por segurança
// As chamadas para OpenAI agora passam pelo endpoint /api/openai-analyze

// Configuração da OpenAI API (SEGURA - sem chaves expostas)
const OPENAI_CONFIG = {
    API_URL: '/api/openai-analyze', // Endpoint seguro local
    MODEL: 'gpt-4o',
    MAX_TOKENS: 500
};

// Configuração do Supabase
const SUPABASE_CONFIG = {
    URL: process.env.SUPABASE_URL || 'sua-url-supabase-aqui',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || 'sua-chave-supabase-aqui'
};

// Configurações de segurança
const SECURITY_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    RATE_LIMIT_REQUESTS: 10, // Máximo de requests por minuto
    RATE_LIMIT_WINDOW: 60000, // 1 minuto em ms
    MAX_DESCRIPTION_LENGTH: 100,
    MAX_VALUE: 999999
};

// Validação de configuração
function validateConfig() {
    const errors = [];
    
    if (SUPABASE_CONFIG.URL === 'sua-url-supabase-aqui') {
        errors.push('SUPABASE_URL não configurada');
    }
    
    if (SUPABASE_CONFIG.ANON_KEY === 'sua-chave-supabase-aqui') {
        errors.push('SUPABASE_ANON_KEY não configurada');
    }
    
    if (errors.length > 0) {
        console.error('❌ Erros de configuração:', errors);
        return false;
    }
    
    console.log('✅ Configuração validada com sucesso');
    return true;
}

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OPENAI_CONFIG, SUPABASE_CONFIG, SECURITY_CONFIG, validateConfig };
} else {
    window.OPENAI_CONFIG = OPENAI_CONFIG;
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.SECURITY_CONFIG = SECURITY_CONFIG;
    window.validateConfig = validateConfig;
    
    // Validar configuração ao carregar
    document.addEventListener('DOMContentLoaded', validateConfig);
}