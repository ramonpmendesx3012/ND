// FASE 3: Script de Validação da Camada de Serviços
// Testa todas as funções CRUD dos serviços sem depender da UI

import supabase from './src/config/supabaseClient.js';
import ndServicePkg from './src/services/ndService.js';
import launchServicePkg from './src/services/launchService.js';

const { ndService } = ndServicePkg;
const { launchService } = launchServicePkg;

// Função principal de validação
async function validateServices() {
  console.log('🔍 INICIANDO VALIDAÇÃO DA CAMADA DE SERVIÇOS');
  console.log('=' .repeat(60));
  
  let testNdId = null;
  let testLaunchId = null;
  
  try {
    // 1. Testar criação de ND
    console.log('\n1️⃣ Testando criação de ND...');
    const testNdNumber = `TEST_${Date.now()}`;
    const newND = await ndService.createND(testNdNumber, 'ND de Teste - Validação de Serviços');
    testNdId = newND.id;
    console.log(`✅ ND criada com sucesso (ID: ${testNdId})`);
    
    // 2. Testar busca de ND aberta
    console.log('\n2️⃣ Testando busca de ND aberta...');
    const openND = await ndService.fetchOpenND();
    if (openND && openND.id === testNdId) {
      console.log('✅ ND aberta encontrada corretamente');
    } else {
      console.log('⚠️ ND aberta não corresponde à criada (pode haver outras NDs abertas)');
    }
    
    // 3. Testar atualização de adiantamento
    console.log('\n3️⃣ Testando atualização de adiantamento...');
    const updatedND = await ndService.updateAdiantamento(testNdId, 500.00);
    if (updatedND.valor_adiantamento === 500.00) {
      console.log('✅ Adiantamento atualizado corretamente');
    } else {
      throw new Error('Valor do adiantamento não foi atualizado');
    }
    
    // 4. Testar atualização de descrição
    console.log('\n4️⃣ Testando atualização de descrição...');
    const newDescription = 'ND Atualizada - Teste de Serviços';
    const updatedNDDesc = await ndService.updateDescription(testNdId, newDescription);
    if (updatedNDDesc.descricao === newDescription) {
      console.log('✅ Descrição atualizada corretamente');
    } else {
      throw new Error('Descrição não foi atualizada');
    }
    
    // 5. Testar busca de dados específicos da ND
    console.log('\n5️⃣ Testando busca de dados da ND...');
    const ndData = await ndService.getNDData(testNdId, 'id, numero_nd, descricao, valor_adiantamento');
    if (ndData && ndData.id === testNdId) {
      console.log('✅ Dados da ND recuperados corretamente');
    } else {
      throw new Error('Dados da ND não foram recuperados');
    }
    
    // 6. Testar adição de lançamento
    console.log('\n6️⃣ Testando adição de lançamento...');
    const launchData = {
      ndId: testNdId,
      date: new Date().toISOString().split('T')[0],
      value: 75.50,
      description: 'Lançamento de Teste - Validação',
      category: 'Alimentação',
      estabelecimento: 'Restaurante Teste',
      imageUrl: 'https://via.placeholder.com/150',
      confidence: 95
    };
    
    const newLaunch = await launchService.addLaunch(launchData);
    testLaunchId = newLaunch.id;
    console.log(`✅ Lançamento criado com sucesso (ID: ${testLaunchId})`);
    
    // 7. Testar busca de lançamentos por ND
    console.log('\n7️⃣ Testando busca de lançamentos por ND...');
    const launches = await launchService.getLaunchesByND(testNdId);
    if (launches.length > 0 && launches.some(l => l.id === testLaunchId)) {
      console.log(`✅ Lançamentos recuperados corretamente (${launches.length} encontrados)`);
    } else {
      throw new Error('Lançamentos não foram recuperados corretamente');
    }
    
    // 8. Testar busca de lançamento por ID
    console.log('\n8️⃣ Testando busca de lançamento por ID...');
    const launchById = await launchService.getLaunchById(testLaunchId);
    if (launchById && launchById.id === testLaunchId) {
      console.log('✅ Lançamento recuperado por ID corretamente');
    } else {
      throw new Error('Lançamento não foi recuperado por ID');
    }
    
    // 9. Testar atualização de lançamento
    console.log('\n9️⃣ Testando atualização de lançamento...');
    const updateData = {
      valor: 85.75,
      descricao: 'Lançamento Atualizado - Teste'
    };
    const updatedLaunch = await launchService.updateLaunch(testLaunchId, updateData);
    if (updatedLaunch.valor === 85.75) {
      console.log('✅ Lançamento atualizado corretamente');
    } else {
      throw new Error('Lançamento não foi atualizado');
    }
    
    // 10. Testar cálculo de total da ND
    console.log('\n🔟 Testando cálculo de total da ND...');
    const total = await launchService.calculateNDTotal(testNdId);
    if (typeof total === 'number' && total > 0) {
      console.log(`✅ Total calculado corretamente: R$ ${total.toFixed(2)}`);
    } else {
      throw new Error('Total da ND não foi calculado corretamente');
    }
    
    // 11. Testar exclusão de lançamento
    console.log('\n1️⃣1️⃣ Testando exclusão de lançamento...');
    const deleteResult = await launchService.deleteLaunch(testLaunchId);
    console.log('✅ Lançamento excluído com sucesso');
    
    // Verificar se foi realmente excluído
    const launchesAfterDelete = await launchService.getLaunchesByND(testNdId);
    if (!launchesAfterDelete.some(l => l.id === testLaunchId)) {
      console.log('✅ Exclusão confirmada - lançamento não encontrado');
    } else {
      throw new Error('Lançamento não foi excluído corretamente');
    }
    
    // 12. Testar finalização da ND
    console.log('\n1️⃣2️⃣ Testando finalização da ND...');
    const finalizedND = await ndService.finalizeND(testNdId, 'ND Finalizada - Teste Completo');
    if (finalizedND.status === 'fechada') {
      console.log('✅ ND finalizada corretamente');
    } else {
      throw new Error('ND não foi finalizada corretamente');
    }
    
    // 13. Limpeza - excluir ND de teste
    console.log('\n1️⃣3️⃣ Limpando dados de teste...');
    await cleanupTestData(testNdId);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 VALIDAÇÃO DA CAMADA DE SERVIÇOS BEM-SUCEDIDA');
    console.log('✅ Todas as operações CRUD foram executadas com sucesso');
    console.log('✅ NDService funcionando corretamente');
    console.log('✅ LaunchService funcionando corretamente');
    console.log('✅ Integração com Supabase validada');
    console.log('✅ Sistema pronto para integração com a UI');
    
  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('❌ FALHA NA VALIDAÇÃO DA CAMADA DE SERVIÇOS');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    
    // Tentar limpeza mesmo em caso de erro
    if (testNdId) {
      console.log('\n🧹 Tentando limpeza de dados de teste...');
      try {
        await cleanupTestData(testNdId);
        console.log('✅ Limpeza concluída');
      } catch (cleanupError) {
        console.warn('⚠️ Erro na limpeza:', cleanupError.message);
      }
    }
    
    process.exit(1);
  }
}

// Função para limpeza dos dados de teste
async function cleanupTestData(ndId) {
  try {
    // Excluir lançamentos primeiro (devido à foreign key)
    const { error: launchError } = await supabase
      .from('lancamentos')
      .delete()
      .eq('nd_id', ndId);
    
    if (launchError) {
      console.warn('⚠️ Aviso ao excluir lançamentos:', launchError.message);
    }
    
    // Excluir ND
    const { error: ndError } = await supabase
      .from('nd_viagens')
      .delete()
      .eq('id', ndId);
    
    if (ndError) {
      console.warn('⚠️ Aviso ao excluir ND:', ndError.message);
    } else {
      console.log('✅ Dados de teste removidos');
    }
  } catch (error) {
    console.warn('⚠️ Erro na limpeza:', error.message);
  }
}

// Executar validação
if (import.meta.url === `file://${process.argv[1]}`) {
  validateServices();
}

export { validateServices };