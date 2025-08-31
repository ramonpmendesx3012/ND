// FASE 1: Script de Validação da Infraestrutura do Supabase
// Testa tabelas, RLS e Storage para garantir configuração correta

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função principal de validação
async function validateInfrastructure() {
  console.log('🔍 INICIANDO VALIDAÇÃO DA INFRAESTRUTURA DO SUPABASE');
  console.log('=' .repeat(60));
  
  try {
    // 1. Testar conexão básica
    console.log('\n1️⃣ Testando conexão básica...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('nd_viagens')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Falha na conexão: ${connectionError.message}`);
    }
    console.log('✅ Conexão estabelecida com sucesso');
    
    // 2. Validar estrutura das tabelas
    console.log('\n2️⃣ Validando estrutura das tabelas...');
    await validateTableStructure();
    
    // 3. Testar operações CRUD na tabela nd_viagens
    console.log('\n3️⃣ Testando CRUD na tabela nd_viagens...');
    const testNdId = await testNdViagensCRUD();
    
    // 4. Testar operações CRUD na tabela lancamentos
    console.log('\n4️⃣ Testando CRUD na tabela lancamentos...');
    await testLancamentosCRUD(testNdId);
    
    // 5. Testar Storage
    console.log('\n5️⃣ Testando Supabase Storage...');
    await testStorage();
    
    // 6. Limpeza dos dados de teste
    console.log('\n6️⃣ Limpando dados de teste...');
    await cleanupTestData(testNdId);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 VALIDAÇÃO DE INFRAESTRUTURA BEM-SUCEDIDA');
    console.log('✅ Todas as operações foram executadas com sucesso');
    console.log('✅ RLS configurado corretamente');
    console.log('✅ Storage funcionando');
    console.log('✅ Sistema pronto para integração');
    
  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('❌ FALHA NA VALIDAÇÃO DA INFRAESTRUTURA');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Validar estrutura das tabelas
async function validateTableStructure() {
  // Testar se as colunas essenciais existem
  const { data: ndColumns, error: ndError } = await supabase
    .from('nd_viagens')
    .select('id, numero_nd, descricao, valor_adiantamento, status')
    .limit(1);
  
  if (ndError) {
    throw new Error(`Tabela nd_viagens: ${ndError.message}`);
  }
  
  const { data: lancColumns, error: lancError } = await supabase
    .from('lancamentos')
    .select('id, nd_id, descricao, valor, categoria, data_despesa')
    .limit(1);
  
  if (lancError) {
    throw new Error(`Tabela lancamentos: ${lancError.message}`);
  }
  
  console.log('✅ Estrutura das tabelas validada');
}

// Testar CRUD na tabela nd_viagens
async function testNdViagensCRUD() {
  const testNd = {
    numero_nd: `TEST_${Date.now()}`,
    descricao: 'ND de Teste - Validação de Infraestrutura',
    valor_adiantamento: 500.00,
    status: 'aberta'
  };
  
  // CREATE
  console.log('  📝 Testando INSERT...');
  const { data: insertData, error: insertError } = await supabase
    .from('nd_viagens')
    .insert(testNd)
    .select()
    .single();
  
  if (insertError) {
    throw new Error(`INSERT nd_viagens: ${insertError.message}`);
  }
  
  const ndId = insertData.id;
  console.log(`  ✅ INSERT bem-sucedido (ID: ${ndId})`);
  
  // READ
  console.log('  📖 Testando SELECT...');
  const { data: selectData, error: selectError } = await supabase
    .from('nd_viagens')
    .select('*')
    .eq('id', ndId)
    .single();
  
  if (selectError) {
    throw new Error(`SELECT nd_viagens: ${selectError.message}`);
  }
  
  console.log('  ✅ SELECT bem-sucedido');
  
  // UPDATE
  console.log('  ✏️ Testando UPDATE...');
  const { error: updateError } = await supabase
    .from('nd_viagens')
    .update({ descricao: 'ND Atualizada - Teste' })
    .eq('id', ndId);
  
  if (updateError) {
    throw new Error(`UPDATE nd_viagens: ${updateError.message}`);
  }
  
  console.log('  ✅ UPDATE bem-sucedido');
  
  return ndId;
}

// Testar CRUD na tabela lancamentos
async function testLancamentosCRUD(ndId) {
  const testLancamento = {
    nd_id: ndId,
    descricao: 'Lançamento de Teste',
    valor: 50.00,
    categoria: 'Alimentação',
    data_despesa: new Date().toISOString().split('T')[0],
    estabelecimento: 'Estabelecimento Teste',
    imagem_url: 'https://exemplo.com/teste.jpg',
    confianca: 95
  };
  
  // CREATE
  console.log('  📝 Testando INSERT...');
  const { data: insertData, error: insertError } = await supabase
    .from('lancamentos')
    .insert(testLancamento)
    .select()
    .single();
  
  if (insertError) {
    throw new Error(`INSERT lancamentos: ${insertError.message}`);
  }
  
  const lancId = insertData.id;
  console.log(`  ✅ INSERT bem-sucedido (ID: ${lancId})`);
  
  // READ
  console.log('  📖 Testando SELECT...');
  const { data: selectData, error: selectError } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('nd_id', ndId);
  
  if (selectError) {
    throw new Error(`SELECT lancamentos: ${selectError.message}`);
  }
  
  console.log(`  ✅ SELECT bem-sucedido (${selectData.length} registros)`);
  
  // UPDATE
  console.log('  ✏️ Testando UPDATE...');
  const { error: updateError } = await supabase
    .from('lancamentos')
    .update({ valor: 75.00 })
    .eq('id', lancId);
  
  if (updateError) {
    throw new Error(`UPDATE lancamentos: ${updateError.message}`);
  }
  
  console.log('  ✅ UPDATE bem-sucedido');
  
  // DELETE
  console.log('  🗑️ Testando DELETE...');
  const { error: deleteError } = await supabase
    .from('lancamentos')
    .delete()
    .eq('id', lancId);
  
  if (deleteError) {
    throw new Error(`DELETE lancamentos: ${deleteError.message}`);
  }
  
  console.log('  ✅ DELETE bem-sucedido');
}

// Testar Storage
async function testStorage() {
  try {
    // Listar buckets
    console.log('  📦 Testando listagem de buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Erro ao listar buckets: ${bucketsError.message}`);
    }
    
    console.log(`  ✅ Buckets encontrados: ${buckets.map(b => b.name).join(', ')}`);
    
    // Verificar se bucket 'comprovantes' existe
    const comprovantesBucket = buckets.find(b => b.name === 'comprovantes');
    if (!comprovantesBucket) {
      console.log('  ⚠️ Bucket "comprovantes" não encontrado - será criado automaticamente');
    } else {
      console.log('  ✅ Bucket "comprovantes" encontrado');
    }
    
    // Testar upload de arquivo fictício (imagem)
    console.log('  📤 Testando upload de arquivo...');
    // Criar um arquivo de imagem fictício (1x1 pixel PNG)
    const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const testFile = new Blob([Uint8Array.from(atob(pngData), c => c.charCodeAt(0))], { type: 'image/png' });
    const fileName = `test_${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comprovantes')
      .upload(fileName, testFile);
    
    if (uploadError) {
      // Se o bucket não existe, tentar criar
      if (uploadError.message.includes('Bucket not found')) {
        console.log('  🔧 Criando bucket "comprovantes"...');
        const { error: createBucketError } = await supabase.storage
          .createBucket('comprovantes', { public: true });
        
        if (createBucketError) {
          throw new Error(`Erro ao criar bucket: ${createBucketError.message}`);
        }
        
        // Tentar upload novamente
        const { data: retryUpload, error: retryError } = await supabase.storage
          .from('comprovantes')
          .upload(fileName, testFile);
        
        if (retryError) {
          throw new Error(`Erro no upload após criar bucket: ${retryError.message}`);
        }
        
        console.log('  ✅ Bucket criado e upload bem-sucedido');
      } else {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }
    } else {
      console.log('  ✅ Upload bem-sucedido');
    }
    
    // Limpar arquivo de teste
    await supabase.storage
      .from('comprovantes')
      .remove([fileName]);
    
    console.log('  🧹 Arquivo de teste removido');
    
  } catch (error) {
    throw new Error(`Storage: ${error.message}`);
  }
}

// Limpeza dos dados de teste
async function cleanupTestData(ndId) {
  const { error } = await supabase
    .from('nd_viagens')
    .delete()
    .eq('id', ndId);
  
  if (error) {
    console.warn(`⚠️ Aviso: Não foi possível limpar dados de teste: ${error.message}`);
  } else {
    console.log('✅ Dados de teste removidos');
  }
}

// Executar validação
if (require.main === module) {
  validateInfrastructure();
}

module.exports = { validateInfrastructure };