// Testes para ndService
import { ndService } from '../ndService.js';

// Mock do apiClient
jest.mock('../../config/apiClient.js', () => ({
  apiClient: {
    query: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

import { apiClient } from '../../config/apiClient.js';

describe('ndService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchOpenND', () => {
    test('busca ND aberta com sucesso', async () => {
      const mockResponse = {
        data: [{
          id: 'nd-123',
          numero_nd: 'ND-001',
          descricao: 'Viagem SP',
          status: 'aberta',
          valor_adiantamento: 1000.00
        }]
      };

      apiClient.query.mockResolvedValue(mockResponse);

      const result = await ndService.fetchOpenND();

      expect(apiClient.query).toHaveBeenCalledWith('nd_viagens', {
        filters: [{ column: 'status', operator: 'eq', value: 'aberta' }],
        limit: 1
      });

      expect(result).toEqual(mockResponse.data[0]);
    });

    test('retorna null quando não há ND aberta', async () => {
      const mockResponse = { data: [] };

      apiClient.query.mockResolvedValue(mockResponse);

      const result = await ndService.fetchOpenND();

      expect(result).toBe(null);
    });
  });

  describe('createND', () => {
    test('cria nova ND com sucesso', async () => {
      const numero = 'ND-001';
      const descricao = 'Viagem de negócios';

      const mockResponse = {
        data: [{
          id: 'nd-123',
          numero_nd: numero,
          descricao: descricao,
          status: 'aberta',
          valor_adiantamento: 0.00,
          created_at: '2024-01-15T12:00:00Z'
        }]
      };

      apiClient.insert.mockResolvedValue(mockResponse);

      const result = await ndService.createND(numero, descricao);

      expect(apiClient.insert).toHaveBeenCalledWith('nd_viagens', {
        numero_nd: numero,
        descricao: descricao,
        status: 'aberta',
        valor_adiantamento: 0.00
      });

      expect(result).toEqual(mockResponse.data[0]);
    });

    test('cria ND com descrição padrão', async () => {
      const numero = 'ND-002';

      const mockResponse = {
        data: [{
          id: 'nd-124',
          numero_nd: numero,
          descricao: 'Nova Nota de Despesa',
          status: 'aberta',
          valor_adiantamento: 0.00
        }]
      };

      apiClient.insert.mockResolvedValue(mockResponse);

      const result = await ndService.createND(numero);

      expect(apiClient.insert).toHaveBeenCalledWith('nd_viagens', {
        numero_nd: numero,
        descricao: 'Nova Nota de Despesa',
        status: 'aberta',
        valor_adiantamento: 0.00
      });

      expect(result).toEqual(mockResponse.data[0]);
    });

    test('lança erro quando falha ao criar ND', async () => {
      const numero = 'ND-001';
      const descricao = 'Viagem de negócios';

      apiClient.insert.mockRejectedValue(new Error('Erro de rede'));

      await expect(ndService.createND(numero, descricao))
        .rejects.toThrow('Erro de rede');
    });
  });

  describe('finalizeND', () => {
    test('finaliza ND com sucesso', async () => {
      const ndId = 'nd-123';
      const descricao = 'Viagem finalizada';
      const mockResponse = {
        data: [{
          id: ndId,
          status: 'fechada',
          descricao: descricao,
          updated_at: '2024-01-15T12:00:00Z'
        }]
      };

      apiClient.update.mockResolvedValue(mockResponse);

      const result = await ndService.finalizeND(ndId, descricao);

      expect(apiClient.update).toHaveBeenCalledWith('nd_viagens', 
        { 
          descricao: descricao,
          status: 'fechada',
          updated_at: expect.any(String)
        },
        [{ column: 'id', operator: 'eq', value: ndId }]
      );

      expect(result).toEqual(mockResponse.data[0]);
    });

    test('lança erro quando falha ao finalizar ND', async () => {
      const ndId = 'nd-123';
      const descricao = 'Viagem finalizada';

      apiClient.update.mockRejectedValue(new Error('ND não encontrada'));

      await expect(ndService.finalizeND(ndId, descricao))
        .rejects.toThrow('ND não encontrada');
    });
  });

  describe('updateAdiantamento', () => {
    test('atualiza valor de adiantamento com sucesso', async () => {
      const ndId = 'nd-123';
      const valor = 1500.00;
      const mockResponse = {
        data: [{
          id: ndId,
          valor_adiantamento: valor,
          updated_at: '2024-01-15T12:00:00Z'
        }]
      };

      apiClient.update.mockResolvedValue(mockResponse);

      const result = await ndService.updateAdiantamento(ndId, valor);

      expect(apiClient.update).toHaveBeenCalledWith('nd_viagens', 
        { valor_adiantamento: valor },
        [{ column: 'id', operator: 'eq', value: ndId }]
      );

      expect(result).toEqual(mockResponse.data[0]);
    });

    test('lança erro quando falha ao atualizar adiantamento', async () => {
      const ndId = 'nd-123';
      const valor = 1500.00;

      apiClient.update.mockRejectedValue(new Error('ND não encontrada'));

      await expect(ndService.updateAdiantamento(ndId, valor))
        .rejects.toThrow('ND não encontrada');
    });
  });

  describe('updateDescription', () => {
    test('atualiza descrição da ND com sucesso', async () => {
      const ndId = 'nd-123';
      const descricao = 'Nova descrição da viagem';
      const mockResponse = {
        data: [{
          id: ndId,
          descricao: descricao,
          updated_at: '2024-01-15T12:00:00Z'
        }]
      };

      apiClient.update.mockResolvedValue(mockResponse);

      const result = await ndService.updateDescription(ndId, descricao);

      expect(apiClient.update).toHaveBeenCalledWith('nd_viagens', 
        { descricao: descricao },
        [{ column: 'id', operator: 'eq', value: ndId }]
      );

      expect(result).toEqual(mockResponse.data[0]);
    });

    test('lança erro quando falha ao atualizar descrição', async () => {
      const ndId = 'nd-123';
      const descricao = 'Nova descrição';

      apiClient.update.mockRejectedValue(new Error('ND não encontrada'));

      await expect(ndService.updateDescription(ndId, descricao))
        .rejects.toThrow('ND não encontrada');
    });
  });

  describe('getNDData', () => {
    test('busca dados da ND com sucesso', async () => {
      const ndId = 'nd-123';
      const mockResponse = {
        data: [{
          id: ndId,
          numero_nd: 'ND-001',
          descricao: 'Viagem SP',
          status: 'aberta',
          valor_adiantamento: 1000.00
        }]
      };

      apiClient.query.mockResolvedValue(mockResponse);

      const result = await ndService.getNDData(ndId);

      expect(apiClient.query).toHaveBeenCalledWith('nd_viagens', {
        select: '*',
        filters: [{ column: 'id', operator: 'eq', value: ndId }],
        limit: 1
      });

      expect(result).toEqual(mockResponse.data[0]);
    });

    test('busca dados específicos da ND', async () => {
      const ndId = 'nd-123';
      const select = 'numero_nd, descricao';
      const mockResponse = {
        data: [{
          numero_nd: 'ND-001',
          descricao: 'Viagem SP'
        }]
      };

      apiClient.query.mockResolvedValue(mockResponse);

      const result = await ndService.getNDData(ndId, select);

      expect(apiClient.query).toHaveBeenCalledWith('nd_viagens', {
        select: select,
        filters: [{ column: 'id', operator: 'eq', value: ndId }],
        limit: 1
      });

      expect(result).toEqual(mockResponse.data[0]);
    });

    test('retorna null quando ND não é encontrada', async () => {
      const ndId = 'nd-inexistente';
      const mockResponse = { data: [] };

      apiClient.query.mockResolvedValue(mockResponse);

      const result = await ndService.getNDData(ndId);

      expect(result).toBe(null);
    });
  });

  describe('generateNextNDNumber', () => {
    test('gera próximo número de ND', () => {
      const counter = 1;
      const result = ndService.generateNextNDNumber(counter);
      
      expect(result).toBe('ND001');
    });

    test('gera número com zero padding', () => {
      const counter = 25;
      const result = ndService.generateNextNDNumber(counter);
      
      expect(result).toBe('ND025');
    });

    test('gera número para contador maior', () => {
      const counter = 999;
      const result = ndService.generateNextNDNumber(counter);
      
      expect(result).toBe('ND999');
    });
  });
});