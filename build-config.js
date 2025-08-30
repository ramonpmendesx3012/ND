// build-config.js - Script para gerar config.js com variáveis de ambiente
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando geração do config.js para produção...');

// Verificar se as variáveis de ambiente estão definidas
const requiredEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
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
  console.error('📝 Variáveis necessárias:');
  console.error('   OPENAI_API_KEY=sk-proj-...');
  console.error('   SUPABASE_URL=https://....supabase.co');
  console.error('   SUPABASE_ANON_KEY=eyJhbGciOi...');
  process.exit(1);
}

// Gerar conteúdo do config.js
const configContent = `// config.js - Gerado automaticamente pelo build-config.js
// ⚠️ ATENÇÃO: Este arquivo contém chaves de API. Não commitar em produção!

// Configuração da OpenAI API
const OPENAI_CONFIG = {
    API_KEY: '${requiredEnvVars.OPENAI_API_KEY}',
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4o',
    MAX_TOKENS: 500
};

// Configuração do Supabase
const SUPABASE_CONFIG = {
    URL: '${requiredEnvVars.SUPABASE_URL}',
    ANON_KEY: '${requiredEnvVars.SUPABASE_ANON_KEY}'
};

// Validação das configurações
if (OPENAI_CONFIG.API_KEY === 'sua-chave-openai-aqui' || 
    SUPABASE_CONFIG.URL === 'sua-url-supabase-aqui' ||
    SUPABASE_CONFIG.ANON_KEY === 'sua-chave-supabase-aqui') {
    console.error('❌ Erro: Configurações não foram definidas corretamente!');
    console.error('Verifique as variáveis de ambiente no Vercel.');
}

// Log de configuração (sem expor chaves completas)
console.log('🔧 Configurações carregadas:');
console.log('   OpenAI API Key:', OPENAI_CONFIG.API_KEY ? OPENAI_CONFIG.API_KEY.substring(0, 20) + '...' : 'NÃO DEFINIDA');
console.log('   Supabase URL:', SUPABASE_CONFIG.URL);
console.log('   Supabase Key:', SUPABASE_CONFIG.ANON_KEY ? SUPABASE_CONFIG.ANON_KEY.substring(0, 20) + '...' : 'NÃO DEFINIDA');

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OPENAI_CONFIG, SUPABASE_CONFIG };
} else {
    window.OPENAI_CONFIG = OPENAI_CONFIG;
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
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
