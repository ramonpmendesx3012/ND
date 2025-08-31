// FASE 2: Cliente Supabase para Frontend
// Configuração centralizada do cliente Supabase

import { createClient } from '@supabase/supabase-js';

// Verificar se as configurações do Supabase estão disponíveis
const supabaseUrl = window.SUPABASE_CONFIG?.URL;
const supabaseAnonKey = window.SUPABASE_CONFIG?.ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configurações do Supabase não encontradas');
  console.error('Certifique-se de que SUPABASE_CONFIG está definido no config.js');
  throw new Error('Configuração do Supabase incompleta');
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Não usar autenticação de sessão
    autoRefreshToken: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'nd-express-frontend'
    }
  }
});

// Função para testar conexão
export async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    const { data, error } = await supabase
      .from('nd_viagens')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error.message);
    return false;
  }
}

// Função para verificar configuração
export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    environment: 'production',
    debugMode: false
  };
}

// Função para logs de debug
export function debugLog(message, data = null) {
  const config = getSupabaseConfig();
  if (config.debugMode) {
    console.log(`🔧 [Supabase Debug] ${message}`, data || '');
  }
}

// Exportar cliente como padrão
export default supabase;

// Log de inicialização
const config = getSupabaseConfig();
console.log('🚀 Cliente Supabase inicializado:', {
  url: config.url,
  environment: config.environment,
  debugMode: config.debugMode
});