// build-config.js - Script para gerar config.js com variáveis de ambiente
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando geração do config.js para produção...');

// Verificar se as variáveis de ambiente estão definidas
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};

// OPENAI_API_KEY é necessária apenas para serverless functions
const optionalEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Validar variáveis obrigatórias
const missingVars = [];
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value || value === 'undefined') {
    missingVars.push(key);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente não encontradas:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('');
  console.error('💡 Configure as variáveis no Vercel:');
  console.error('   1. Acesse vercel.com → seu projeto → Settings');
  console.error('   2. Vá em Environment Variables');
  console.error('   3. Adicione as variáveis necessárias');
  console.error('');
  console.error('📝 Variáveis obrigatórias para frontend:');
  console.error('   SUPABASE_URL=https://....supabase.co');
  console.error('   SUPABASE_ANON_KEY=eyJhbGciOi...');
  console.error('');
  console.error('📝 Variáveis para serverless functions:');
  console.error('   OPENAI_API_KEY=sk-proj-...');
  process.exit(1);
}

// Gerar conteúdo do config.js
const configContent = `// config.js - Gerado automaticamente pelo build-config.js
// ✅ CONFIGURAÇÃO SEGURA - Chaves protegidas em serverless functions

// Configuração da OpenAI API (SEGURA - sem chaves expostas)
const OPENAI_CONFIG = {
    API_URL: '/api/openai-analyze', // Endpoint seguro local
    MODEL: 'gpt-4o',
    MAX_TOKENS: 500
};

// Configuração do Supabase
const SUPABASE_CONFIG = {
    URL: process.env.SUPABASE_URL || '${requiredEnvVars.SUPABASE_URL}',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || '${requiredEnvVars.SUPABASE_ANON_KEY}'
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

// Log das configurações (sem expor chaves completas)
console.log('🔧 Configurações carregadas:');
console.log('   OpenAI Endpoint:', OPENAI_CONFIG.API_URL);
console.log('   Supabase URL:', SUPABASE_CONFIG.URL);
console.log('   Supabase Key:', SUPABASE_CONFIG.ANON_KEY ? SUPABASE_CONFIG.ANON_KEY.substring(0, 20) + '...' : 'NÃO DEFINIDA');

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
`;

// Escrever arquivo config.js
const configPath = path.join(__dirname, 'config.js');

try {
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ config.js gerado com sucesso!');
  console.log('📍 Localização:', configPath);
  console.log('');
  console.log('🔍 Resumo das configurações:');
  console.log(`   OpenAI API Key: ${requiredEnvVars.OPENAI_API_KEY.substring(0, 20)}...`);
  console.log(`   Supabase URL: ${requiredEnvVars.SUPABASE_URL}`);
  console.log(`   Supabase Key: ${requiredEnvVars.SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log('');
  console.log('🚀 Pronto para deploy no Vercel!');
} catch (error) {
  console.error('❌ Erro ao escrever config.js:', error.message);
  process.exit(1);
}

// Verificar se o arquivo foi criado corretamente
if (fs.existsSync(configPath)) {
  const stats = fs.statSync(configPath);
  console.log(`📊 Arquivo criado: ${stats.size} bytes`);
} else {
  console.error('❌ Erro: Arquivo config.js não foi criado!');
  process.exit(1);
}

console.log('✨ Build concluído com sucesso!');