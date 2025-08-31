// FASE 3: Serviço para operações relacionadas às Notas de Despesa (ND)
// Integração direta com Supabase
import supabase from '../config/supabaseClient.js';
import { ND_STATUS } from '../utils/constants.js';

class NDService {
  /**
   * Busca uma ND aberta no sistema
   * @returns {Promise<Object|null>} ND aberta ou null se não encontrada
   */
  async fetchOpenND() {
    try {
      const { data, error } = await supabase
        .from('nd_viagens')
        .select('*')
        .eq('status', ND_STATUS.ABERTA)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar ND aberta:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova ND
   * @param {string} numero - Número da ND (ex: ND001)
   * @param {string} descricao - Descrição da ND
   * @returns {Promise<Object>} ND criada
   */
  async createND(numero, descricao = 'Nova Nota de Despesa') {
    try {
      const { data, error } = await supabase
        .from('nd_viagens')
        .insert({
          numero_nd: numero,
          descricao: descricao,
          status: ND_STATUS.ABERTA,
          valor_adiantamento: 0.00
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao criar ND:', error);
      throw error;
    }
  }

  /**
   * Finaliza uma ND (muda status para fechada)
   * @param {string} ndId - ID da ND
   * @param {string} descricao - Descrição final da ND
   * @returns {Promise<Object>} ND atualizada
   */
  async finalizeND(ndId, descricao) {
    try {
      const { data, error } = await supabase
        .from('nd_viagens')
        .update({
          descricao: descricao,
          status: ND_STATUS.FECHADA,
          updated_at: new Date().toISOString()
        })
        .eq('id', ndId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao finalizar ND:', error);
      throw error;
    }
  }

  /**
   * Atualiza o valor do adiantamento de uma ND
   * @param {string} ndId - ID da ND
   * @param {number} valor - Valor do adiantamento
   * @returns {Promise<Object>} ND atualizada
   */
  async updateAdiantamento(ndId, valor) {
    try {
      const { data, error } = await supabase
        .from('nd_viagens')
        .update({ valor_adiantamento: valor })
        .eq('id', ndId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar adiantamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza a descrição de uma ND
   * @param {string} ndId - ID da ND
   * @param {string} descricao - Nova descrição
   * @returns {Promise<Object>} ND atualizada
   */
  async updateDescription(ndId, descricao) {
    try {
      const { data, error } = await supabase
        .from('nd_viagens')
        .update({ descricao: descricao })
        .eq('id', ndId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar descrição da ND:', error);
      throw error;
    }
  }

  /**
   * Busca dados específicos de uma ND
   * @param {string} ndId - ID da ND
   * @param {string} select - Campos a serem selecionados
   * @returns {Promise<Object>} Dados da ND
   */
  async getNDData(ndId, select = '*') {
    try {
      const { data, error } = await supabase
        .from('nd_viagens')
        .select(select)
        .eq('id', ndId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar dados da ND:', error);
      throw error;
    }
  }

  /**
   * Gera o próximo número de ND
   * @param {number} counter - Contador atual
   * @returns {string} Próximo número de ND (ex: ND002)
   */
  generateNextNDNumber(counter) {
    return `ND${String(counter).padStart(3, '0')}`;
  }
}

// Exportar instância única (singleton)
export const ndService = new NDService();
export default ndService;