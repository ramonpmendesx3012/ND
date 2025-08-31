// Script para verificar constraints e valores válidos
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkConstraints() {
  console.log('🔍 Verificando dados existentes para entender constraints...');
  
  try {
    // Verificar categorias existentes na tabela lancamentos
    const { data: lancamentos, error } = await supabase
      .from('lancamentos')
      .select('categoria')
      .limit(10);
    
    if (!error && lancamentos) {
      const categorias = [...new Set(lancamentos.map(l => l.categoria))];
      console.log('✅ Categorias encontradas:', categorias);
    } else {
      console.log('⚠️ Nenhum lançamento encontrado ou erro:', error?.message);
    }
    
    // Tentar inserir com categorias comuns
    const categoriasComuns = ['alimentacao', 'transporte', 'hospedagem', 'combustivel', 'outros'];
    
    for (const categoria of categoriasComuns) {
      console.log(`\n🧪 Testando categoria: ${categoria}`);
      
      // Buscar uma ND existente para usar como referência
      const { data: nds } = await supabase
        .from('nd_viagens')
        .select('id')
        .limit(1);
      
      if (!nds || nds.length === 0) {
        console.log('❌ Nenhuma ND encontrada para teste');
        continue;
      }
      
      const testLancamento = {
        nd_id: nds[0].id,
        descricao: `Teste ${categoria}`,
        valor: 10.00,
        categoria: categoria,
        data_despesa: new Date().toISOString().split('T')[0],
        estabelecimento: 'Teste',
        imagem_url: 'https://exemplo.com/teste.jpg',
        confianca: 95
      };
      
      const { data, error } = await supabase
        .from('lancamentos')
        .insert(testLancamento)
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro com categoria '${categoria}':`, error.message);
      } else {
        console.log(`✅ Categoria '${categoria}' aceita`);
        
        // Limpar o teste
        await supabase
          .from('lancamentos')
          .delete()
          .eq('id', data.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkConstraints();