// Testes para ndService - Integração com Supabase
import { ndService } from '../ndService.js';

// Mock do Supabase
jest.mock('../../config/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    }))
  }
}));

import supabase from '../../config/supabaseClient.js';

describe('ndService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchOpenND', () => {
    test('busca ND aberta com sucesso', async () => {
      const mockData = {
        id: 'nd-123',
        numero_nd: 'ND-001',
        descricao: 'Viagem SP',
        status: 'aberta',
        valor_adiantamento: 1000.00
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.fetchOpenND();

      expect(supabase.from).toHaveBeenCalledWith('nd_viagens');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'aberta');
      expect(mockChain.limit).toHaveBeenCalledWith(1);
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test('retorna null quando não há ND aberta', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.fetchOpenND();

      expect(result).toBe(null);
    });
  });

  describe('createND', () => {
    test('cria nova ND com sucesso', async () => {
      const numero = 'ND-001';
      const descricao = 'Viagem de negócios';

      const mockData = {
        id: 'nd-123',
        numero_nd: numero,
        descricao: descricao,
        status: 'aberta',
        valor_adiantamento: 0.00,
        created_at: '2024-01-15T12:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.createND(numero, descricao);

      expect(supabase.from).toHaveBeenCalledWith('nd_viagens');
      expect(mockChain.insert).toHaveBeenCalledWith({
        numero_nd: numero,
        descricao: descricao,
        status: 'aberta',
        valor_adiantamento: 0.00
      });
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test('cria ND com descrição padrão', async () => {
      const numero = 'ND-002';

      const mockData = {
        id: 'nd-124',
        numero_nd: numero,
        descricao: 'Nova Nota de Despesa',
        status: 'aberta',
        valor_adiantamento: 0.00
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.createND(numero);

      expect(mockChain.insert).toHaveBeenCalledWith({
        numero_nd: numero,
        descricao: 'Nova Nota de Despesa',
        status: 'aberta',
        valor_adiantamento: 0.00
      });
      expect(result).toEqual(mockData);
    });

    test('lança erro quando falha ao criar ND', async () => {
      const numero = 'ND-001';
      const descricao = 'Viagem de negócios';

      const errorObj = new Error('Erro de rede');
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: errorObj })
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(ndService.createND(numero, descricao))
        .rejects.toThrow('Erro de rede');
    });
  });

  describe('finalizeND', () => {
    test('finaliza ND com sucesso', async () => {
      const ndId = 'nd-123';
      const descricao = 'Viagem finalizada';

      const mockData = {
        id: ndId,
        descricao: descricao,
        status: 'fechada',
        updated_at: '2024-01-15T15:00:00Z'
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.finalizeND(ndId, descricao);

      expect(supabase.from).toHaveBeenCalledWith('nd_viagens');
      expect(mockChain.update).toHaveBeenCalledWith({
        descricao: descricao,
        status: 'fechada',
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', ndId);
      expect(result).toEqual(mockData);
    });

    test('lança erro quando falha ao finalizar ND', async () => {
      const ndId = 'nd-123';
      const descricao = 'Viagem finalizada';

      const errorObj = new Error('ND não encontrada');
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: errorObj })
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(ndService.finalizeND(ndId, descricao))
        .rejects.toThrow('ND não encontrada');
    });
  });

  describe('updateAdiantamento', () => {
    test('atualiza valor de adiantamento com sucesso', async () => {
      const ndId = 'nd-123';
      const valor = 1500.00;

      const mockData = {
        id: ndId,
        valor_adiantamento: valor
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.updateAdiantamento(ndId, valor);

      expect(mockChain.update).toHaveBeenCalledWith({ valor_adiantamento: valor });
      expect(mockChain.eq).toHaveBeenCalledWith('id', ndId);
      expect(result).toEqual(mockData);
    });

    test('lança erro quando falha ao atualizar adiantamento', async () => {
      const ndId = 'nd-123';
      const valor = 1500.00;

      const errorObj = new Error('ND não encontrada');
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: errorObj })
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(ndService.updateAdiantamento(ndId, valor))
        .rejects.toThrow('ND não encontrada');
    });
  });

  describe('updateDescription', () => {
    test('atualiza descrição da ND com sucesso', async () => {
      const ndId = 'nd-123';
      const descricao = 'Nova descrição';

      const mockData = {
        id: ndId,
        descricao: descricao
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.updateDescription(ndId, descricao);

      expect(mockChain.update).toHaveBeenCalledWith({ descricao: descricao });
      expect(mockChain.eq).toHaveBeenCalledWith('id', ndId);
      expect(result).toEqual(mockData);
    });

    test('lança erro quando falha ao atualizar descrição', async () => {
      const ndId = 'nd-123';
      const descricao = 'Nova descrição';

      const errorObj = new Error('ND não encontrada');
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: errorObj })
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(ndService.updateDescription(ndId, descricao))
        .rejects.toThrow('ND não encontrada');
    });
  });

  describe('getNDData', () => {
    test('busca dados da ND com sucesso', async () => {
      const ndId = 'nd-123';

      const mockData = {
        id: ndId,
        numero_nd: 'ND-001',
        descricao: 'Viagem SP',
        status: 'aberta'
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.getNDData(ndId);

      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', ndId);
      expect(result).toEqual(mockData);
    });

    test('busca dados específicos da ND', async () => {
      const ndId = 'nd-123';
      const select = 'id, numero_nd, status';

      const mockData = {
        id: ndId,
        numero_nd: 'ND-001',
        status: 'aberta'
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.getNDData(ndId, select);

      expect(mockChain.select).toHaveBeenCalledWith(select);
      expect(result).toEqual(mockData);
    });

    test('retorna null quando ND não é encontrada', async () => {
      const ndId = 'nd-inexistente';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await ndService.getNDData(ndId);

      expect(result).toBe(null);
    });
  });

  describe('generateNextNDNumber', () => {
    test('gera próximo número de ND', () => {
      const result = ndService.generateNextNDNumber(1);
      expect(result).toBe('ND001');
    });

    test('gera número com zero padding', () => {
      const result = ndService.generateNextNDNumber(5);
      expect(result).toBe('ND005');
    });

    test('gera número para contador maior', () => {
      const result = ndService.generateNextNDNumber(123);
      expect(result).toBe('ND123');
    });
  });
});