// Testes para launchService
import { launchService } from '../launchService.js';

// Mock do apiClient
jest.mock('../../config/apiClient.js', () => ({
  request: jest.fn()
}));

import { request } from '../../config/apiClient.js';

describe('launchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addLaunch', () => {
    test('adiciona lançamento com sucesso', async () => {
      const mockLaunchData = {
        ndId: 'test-nd-id',
        date: '2024-01-15',
        value: 50.00,
        description: 'Almoço',
        category: 'Alimentação',
        imageUrl: 'https://example.com/image.jpg'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'launch-id-123',
          ...mockLaunchData,
          created_at: '2024-01-15T12:00:00Z'
        }
      };

      request.mockResolvedValue(mockResponse);

      const result = await launchService.addLaunch(mockLaunchData);

      expect(request).toHaveBeenCalledWith('/supabase-insert', {
        method: 'POST',
        body: {
          table: 'lancamentos',
          data: {
            nd_id: mockLaunchData.ndId,
            data_despesa: mockLaunchData.date,
            valor: mockLaunchData.value,
            descricao: mockLaunchData.description,
            categoria: mockLaunchData.category,
            imagem_url: mockLaunchData.imageUrl
          }
        }
      });

      expect(result).toEqual(mockResponse.data);
    });

    test('lança erro quando falha ao adicionar', async () => {
      const mockLaunchData = {
        ndId: 'test-nd-id',
        date: '2024-01-15',
        value: 50.00,
        description: 'Almoço',
        category: 'Alimentação'
      };

      request.mockRejectedValue(new Error('Erro de rede'));

      await expect(launchService.addLaunch(mockLaunchData))
        .rejects.toThrow('Erro ao adicionar lançamento');
    });

    test('valida dados obrigatórios', async () => {
      const invalidData = {
        // ndId ausente
        date: '2024-01-15',
        value: 50.00
      };

      await expect(launchService.addLaunch(invalidData))
        .rejects.toThrow('Dados obrigatórios ausentes');
    });
  });

  describe('fetchLaunchesByND', () => {
    test('busca lançamentos por ND com sucesso', async () => {
      const ndId = 'test-nd-id';
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'launch-1',
            nd_id: ndId,
            data_despesa: '2024-01-15',
            valor: 50.00,
            descricao: 'Almoço',
            categoria: 'Alimentação'
          },
          {
            id: 'launch-2',
            nd_id: ndId,
            data_despesa: '2024-01-16',
            valor: 30.00,
            descricao: 'Taxi',
            categoria: 'Deslocamento'
          }
        ]
      };

      request.mockResolvedValue(mockResponse);

      const result = await launchService.fetchLaunchesByND(ndId);

      expect(request).toHaveBeenCalledWith('/supabase-query', {
        method: 'POST',
        body: {
          table: 'lancamentos',
          select: '*',
          filters: { nd_id: ndId },
          orderBy: { data_despesa: 'asc' }
        }
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('launch-1');
    });

    test('retorna array vazio quando não há lançamentos', async () => {
      const ndId = 'empty-nd-id';
      const mockResponse = {
        success: true,
        data: []
      };

      request.mockResolvedValue(mockResponse);

      const result = await launchService.fetchLaunchesByND(ndId);

      expect(result).toEqual([]);
    });
  });

  describe('deleteLaunch', () => {
    test('exclui lançamento com sucesso', async () => {
      const launchId = 'launch-to-delete';
      const mockResponse = {
        success: true,
        data: { id: launchId }
      };

      request.mockResolvedValue(mockResponse);

      const result = await launchService.deleteLaunch(launchId);

      expect(request).toHaveBeenCalledWith('/supabase-delete', {
        method: 'POST',
        body: {
          table: 'lancamentos',
          filters: { id: launchId }
        }
      });

      expect(result).toBe(true);
    });

    test('lança erro quando falha ao excluir', async () => {
      const launchId = 'invalid-launch-id';

      request.mockRejectedValue(new Error('Lançamento não encontrado'));

      await expect(launchService.deleteLaunch(launchId))
        .rejects.toThrow('Erro ao excluir lançamento');
    });
  });

  describe('convertToLocalFormat', () => {
    test('converte dados do Supabase para formato local', () => {
      const supabaseData = {
        id: 'launch-123',
        nd_id: 'nd-456',
        data_despesa: '2024-01-15',
        valor: 75.50,
        descricao: 'Jantar executivo',
        categoria: 'Alimentação',
        imagem_url: 'https://example.com/receipt.jpg',
        created_at: '2024-01-15T19:30:00Z'
      };

      const result = launchService.convertToLocalFormat(supabaseData);

      expect(result).toEqual({
        id: 'launch-123',
        date: '2024-01-15',
        value: 75.50,
        description: 'Jantar executivo',
        category: 'Alimentação',
        imageUrl: 'https://example.com/receipt.jpg',
        timestamp: '2024-01-15T19:30:00Z'
      });
    });

    test('lida com campos opcionais ausentes', () => {
      const minimalData = {
        id: 'launch-123',
        nd_id: 'nd-456',
        data_despesa: '2024-01-15',
        valor: 25.00,
        descricao: 'Café',
        categoria: 'Alimentação'
      };

      const result = launchService.convertToLocalFormat(minimalData);

      expect(result.imageUrl).toBe('https://via.placeholder.com/150');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('validateLaunchData', () => {
    test('valida dados corretos', () => {
      const validData = {
        ndId: 'nd-123',
        date: '2024-01-15',
        value: 50.00,
        description: 'Almoço',
        category: 'Alimentação'
      };

      expect(() => launchService.validateLaunchData(validData)).not.toThrow();
    });

    test('rejeita dados com campos obrigatórios ausentes', () => {
      const invalidData = {
        date: '2024-01-15',
        value: 50.00
        // ndId, description, category ausentes
      };

      expect(() => launchService.validateLaunchData(invalidData))
        .toThrow('Dados obrigatórios ausentes');
    });

    test('rejeita valor inválido', () => {
      const invalidData = {
        ndId: 'nd-123',
        date: '2024-01-15',
        value: -10.00, // Valor negativo
        description: 'Teste',
        category: 'Alimentação'
      };

      expect(() => launchService.validateLaunchData(invalidData))
        .toThrow('Valor deve ser positivo');
    });

    test('rejeita data inválida', () => {
      const invalidData = {
        ndId: 'nd-123',
        date: 'data-inválida',
        value: 50.00,
        description: 'Teste',
        category: 'Alimentação'
      };

      expect(() => launchService.validateLaunchData(invalidData))
        .toThrow('Data inválida');
    });
  });
});