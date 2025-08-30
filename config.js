// Configuração da OpenAI API
// IMPORTANTE: Substitua 'sua-chave-api-aqui' pela sua chave real da OpenAI
// Para obter uma chave da API:
// 1. Acesse https://platform.openai.com/api-keys
// 2. Faça login na sua conta OpenAI
// 3. Clique em "Create new secret key"
// 4. Copie a chave e substitua abaixo

const OPENAI_CONFIG = {
    API_KEY: process.env.OPENAI_API_KEY || 'sua-chave-openai-aqui',
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4o',
    MAX_TOKENS: 500
};

// Configuração do Supabase
const SUPABASE_CONFIG = {
    URL: process.env.SUPABASE_URL || 'sua-url-supabase-aqui',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || 'sua-chave-supabase-aqui'
};

// ATENÇÃO: Em produção, NUNCA exponha sua chave da API no frontend!
// Esta é uma implementação de demonstração.
// Em produção, use um backend/proxy para fazer as chamadas à API.

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OPENAI_CONFIG;
} else {
    window.OPENAI_CONFIG = OPENAI_CONFIG;
}