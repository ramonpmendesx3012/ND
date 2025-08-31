// FASE 3: Serviço para operações CRUD de lançamentos (despesas)
// Integração direta com Supabase
import supabase from '../config/supabaseClient.js';
import { EXPENSE_CATEGORIES, VALIDATION } from '../utils/constants.js';

class LaunchService {
  /**
   * Adiciona um novo lançamento
   * @param {Object} launchData - Dados do lançamento
   * @returns {Promise<Object>} Lançamento criado
   */
  async addLaunch(launchData) {
    try {
      // Validar dados obrigatórios
      this.validateLaunchData(launchData);
      
      const { data, error } = await supabase
        .from('lancamentos')
        .insert({
          nd_id: launchData.ndId,
          data_despesa: launchData.date,
          valor: parseFloat(launchData.value),
          descricao: launchData.description || 'Não informado',
          categoria: launchData.category,
          estabelecimento: launchData.estabelecimento || 'Não informado',
          imagem_url: launchData.imageUrl || 'https://via.placeholder.com/150',
          confianca: parseInt(launchData.confidence) || 0
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar lançamento:', error);
      throw error;
    }
  }

  /**
   * Busca lançamentos de uma ND específica
   * @param {string} ndId - ID da ND
   * @returns {Promise<Array>} Lista de lançamentos
   */
  async getLaunchesByND(ndId) {
    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('nd_id', ndId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      throw error;
    }
  }

  /**
   * Exclui um lançamento
   * @param {string} launchId - ID do lançamento
   * @returns {Promise<Object>} Resultado da exclusão
   */
  async deleteLaunch(launchId) {
    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', launchId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um lançamento existente
   * @param {string} launchId - ID do lançamento
   * @param {Object} updateData - Dados a serem atualizados
   * @returns {Promise<Object>} Lançamento atualizado
   */
  async updateLaunch(launchId, updateData) {
    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .update(updateData)
        .eq('id', launchId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar lançamento:', error);
      throw error;
    }
  }

  /**
   * Busca um lançamento específico
   * @param {string} launchId - ID do lançamento
   * @returns {Promise<Object|null>} Lançamento encontrado ou null
   */
  async getLaunchById(launchId) {
    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('id', launchId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar lançamento:', error);
      throw error;
    }
  }

  /**
   * Calcula o total de despesas de uma ND
   * @param {string} ndId - ID da ND
   * @returns {Promise<number>} Total das despesas
   */
  async calculateNDTotal(ndId) {
    try {
      const launches = await this.getLaunchesByND(ndId);
      return launches.reduce((total, launch) => total + parseFloat(launch.valor), 0);
    } catch (error) {
      console.error('Erro ao calcular total da ND:', error);
      throw error;
    }
  }

  /**
   * Valida os dados de um lançamento
   * @param {Object} launchData - Dados do lançamento
   * @throws {Error} Se os dados forem inválidos
   */
  validateLaunchData(launchData) {
    const errors = [];

    if (!launchData.ndId) {
      errors.push('ID da ND é obrigatório');
    }

    if (!launchData.date) {
      errors.push('Data da despesa é obrigatória');
    }

    if (!launchData.value || isNaN(parseFloat(launchData.value))) {
      errors.push('Valor da despesa é obrigatório e deve ser numérico');
    } else {
      const value = parseFloat(launchData.value);
      if (value <= VALIDATION.MIN_VALUE || value > VALIDATION.MAX_VALUE) {
        errors.push(`Valor deve estar entre R$ ${VALIDATION.MIN_VALUE} e R$ ${VALIDATION.MAX_VALUE}`);
      }
    }

    if (!launchData.category || !Object.values(EXPENSE_CATEGORIES).includes(launchData.category)) {
      errors.push('Categoria é obrigatória e deve ser válida');
    }

    if (!launchData.imageUrl) {
      errors.push('URL da imagem é obrigatória');
    }

    if (launchData.description && launchData.description.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
      errors.push(`Descrição não pode exceder ${VALIDATION.MAX_DESCRIPTION_LENGTH} caracteres`);
    }

    if (errors.length > 0) {
      throw new Error(`Dados inválidos: ${errors.join(', ')}`);
    }
  }

  /**
   * Converte dados do Supabase para formato local
   * @param {Object} supabaseData - Dados do Supabase
   * @returns {Object} Dados no formato local
   */
  convertToLocalFormat(supabaseData) {
    return {
      id: supabaseData.id,
      date: supabaseData.data_despesa,
      value: parseFloat(supabaseData.valor),
      description: supabaseData.descricao,
      category: supabaseData.categoria,
      // establishment removido - campo não mais necessário
      confidence: supabaseData.confianca,
      imageUrl: supabaseData.imagem_url,
      timestamp: supabaseData.created_at
    };
  }

  /**
   * Converte lista de dados do Supabase para formato local
   * @param {Array} supabaseList - Lista de dados do Supabase
   * @returns {Array} Lista no formato local
   */
  convertListToLocalFormat(supabaseList) {
    return supabaseList.map(item => this.convertToLocalFormat(item));
  }
}

// Exportar instância única (singleton)
export const launchService = new LaunchService();
export default launchService;