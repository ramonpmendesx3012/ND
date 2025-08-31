// Serviço para operações relacionadas às Notas de Despesa (ND)
import { apiClient } from '../config/apiClient.js';
import { ND_STATUS } from '../utils/constants.js';

class NDService {
  /**
   * Busca uma ND aberta no sistema
   * @returns {Promise<Object|null>} ND aberta ou null se não encontrada
   */
  async fetchOpenND() {
    try {
      const response = await apiClient.query('nd_viagens', {
        filters: [{ column: 'status', operator: 'eq', value: ND_STATUS.ABERTA }],
        limit: 1
      });
      
      return response.data && response.data.length > 0 ? response.data[0] : null;
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
      const response = await apiClient.insert('nd_viagens', {
        numero_nd: numero,
        descricao: descricao,
        status: ND_STATUS.ABERTA,
        valor_adiantamento: 0.00
      });
      
      return response.data[0];
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
      const response = await apiClient.update('nd_viagens',
        {
          descricao: descricao,
          status: ND_STATUS.FECHADA,
          updated_at: new Date().toISOString(),
        },
        [{ column: 'id', operator: 'eq', value: ndId }]
      );
      
      return response.data[0];
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
      const response = await apiClient.update('nd_viagens',
        { valor_adiantamento: valor },
        [{ column: 'id', operator: 'eq', value: ndId }]
      );
      
      return response.data[0];
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
      const response = await apiClient.update('nd_viagens',
        { descricao: descricao },
        [{ column: 'id', operator: 'eq', value: ndId }]
      );
      
      return response.data[0];
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
      const response = await apiClient.query('nd_viagens', {
        select: select,
        filters: [{ column: 'id', operator: 'eq', value: ndId }],
        limit: 1
      });
      
      return response.data && response.data.length > 0 ? response.data[0] : null;
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