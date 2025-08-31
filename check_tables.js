// Script para verificar tabelas existentes no Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('🔍 Verificando tabelas existentes no Supabase...');
  
  try {
    // Tentar listar algumas tabelas comuns
    const tables = ['nd_viagens', 'lancamentos', 'usuarios', 'launches', 'nds'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Tabela '${table}' existe`);
          if (data && data.length > 0) {
            console.log(`   Colunas encontradas:`, Object.keys(data[0]));
          }
        }
      } catch (e) {
        console.log(`❌ Tabela '${table}' não existe ou sem acesso`);
      }
    }
    
    // Verificar buckets do Storage
    console.log('\n📦 Verificando buckets do Storage...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Erro ao acessar Storage:', bucketsError.message);
    } else {
      console.log('✅ Buckets encontrados:', buckets.map(b => b.name));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkTables();