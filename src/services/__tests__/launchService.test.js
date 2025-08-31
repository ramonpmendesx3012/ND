// Testes para launchService - Integração com Supabase
import { launchService } from '../launchService.js';

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
      order: jest.fn().mockReturnThis(),
      single: jest.fn()
    }))
  }
}));

import supabase from '../../config/supabaseClient.js';

describe('launchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addLaunch', () => {
    test('adiciona lançamento com sucesso', async () => {
      const mockLaunchData = {
        ndId: 'nd-123',
        date: '2024-01-15',
        value: 75.50,
        description: 'Almoço executivo',
        category: 'Alimentação',
        estabelecimento: 'Restaurante ABC',
        imageUrl: 'https://example.com/image.jpg',
        confidence: 95
      };

      const mockData = {
        id: 'launch-123',
        nd_id: 'nd-123',
        data_despesa: '2024-01-15',
        valor: 75.50,
        descricao: 'Almoço executivo',
        categoria: 'Alimentação',
        estabelecimento: 'Restaurante ABC',
        imagem_url: 'https://example.com/image.jpg',
        confianca: 95,
        created_at: '2024-01-15T12:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await launchService.addLaunch(mockLaunchData);

      expect(supabase.from).toHaveBeenCalledWith('lancamentos');
      expect(mockChain.insert).toHaveBeenCalledWith({
        nd_id: 'nd-123',
        data_despesa: '2024-01-15',
        valor: 75.50,
        descricao: 'Almoço executivo',
        categoria: 'Alimentação',
        estabelecimento: 'Restaurante ABC',
        imagem_url: 'https://example.com/image.jpg',
        confianca: 95
      });
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test('lança erro quando falha ao adicionar', async () => {
       const mockLaunchData = {
         ndId: 'nd-123',
         date: '2024-01-15',
         value: 75.50,
         description: 'Almoço executivo',
         category: 'Alimentação',
         imageUrl: 'https://example.com/image.jpg'
       };

       const errorObj = new Error('Erro de rede');
       const mockChain = {
         insert: jest.fn().mockReturnThis(),
         select: jest.fn().mockReturnThis(),
         single: jest.fn().mockResolvedValue({ data: null, error: errorObj })
       };

       supabase.from.mockReturnValue(mockChain);

       await expect(launchService.addLaunch(mockLaunchData))
         .rejects.toThrow('Erro de rede');
     });

    test('valida dados obrigatórios', async () => {
      const invalidLaunchData = {
        // ndId ausente
        date: '2024-01-15',
        value: 75.50
      };

      await expect(launchService.addLaunch(invalidLaunchData))
        .rejects.toThrow();
    });
  });

  describe('getLaunchesByND', () => {
    test('busca lançamentos por ND com sucesso', async () => {
      const ndId = 'nd-123';
      const mockData = [
        {
          id: 'launch-1',
          nd_id: ndId,
          data_despesa: '2024-01-15',
          valor: 75.50,
          descricao: 'Almoço',
          categoria: 'Alimentação'
        },
        {
          id: 'launch-2',
          nd_id: ndId,
          data_despesa: '2024-01-16',
          valor: 120.00,
          descricao: 'Jantar',
          categoria: 'Alimentação'
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await launchService.getLaunchesByND(ndId);

      expect(supabase.from).toHaveBeenCalledWith('lancamentos');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('nd_id', ndId);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockData);
    });

    test('retorna array vazio quando não há lançamentos', async () => {
      const ndId = 'nd-empty';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await launchService.getLaunchesByND(ndId);

      expect(result).toEqual([]);
    });
  });

  describe('deleteLaunch', () => {
    test('exclui lançamento com sucesso', async () => {
      const launchId = 'launch-123';
      const mockData = [{ id: launchId }];

      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await launchService.deleteLaunch(launchId);

      expect(supabase.from).toHaveBeenCalledWith('lancamentos');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', launchId);
      expect(mockChain.select).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: mockData });
    });

    test('lança erro quando falha ao excluir', async () => {
      const launchId = 'invalid-launch-id';
      const errorObj = new Error('Lançamento não encontrado');

      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: null, error: errorObj })
      };

      supabase.from.mockReturnValue(mockChain);

      await expect(launchService.deleteLaunch(launchId))
        .rejects.toThrow('Lançamento não encontrado');
    });
  });

  describe('updateLaunch', () => {
    test('atualiza lançamento com sucesso', async () => {
      const launchId = 'launch-123';
      const updateData = {
        valor: 85.75,
        descricao: 'Almoço atualizado'
      };

      const mockData = {
        id: launchId,
        valor: 85.75,
        descricao: 'Almoço atualizado'
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await launchService.updateLaunch(launchId, updateData);

      expect(mockChain.update).toHaveBeenCalledWith(updateData);
      expect(mockChain.eq).toHaveBeenCalledWith('id', launchId);
      expect(result).toEqual(mockData);
    });
  });

  describe('getLaunchById', () => {
    test('busca lançamento por ID com sucesso', async () => {
      const launchId = 'launch-123';
      const mockData = {
        id: launchId,
        nd_id: 'nd-123',
        valor: 75.50,
        descricao: 'Almoço'
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await launchService.getLaunchById(launchId);

      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', launchId);
      expect(result).toEqual(mockData);
    });

    test('retorna null quando lançamento não é encontrado', async () => {
      const launchId = 'launch-inexistente';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await launchService.getLaunchById(launchId);

      expect(result).toBe(null);
    });
  });

  describe('calculateNDTotal', () => {
    test('calcula total da ND corretamente', async () => {
      const ndId = 'nd-123';
      const mockLaunches = [
        { valor: 75.50 },
        { valor: 120.00 },
        { valor: 45.25 }
      ];

      // Mock do método getLaunchesByND
      jest.spyOn(launchService, 'getLaunchesByND').mockResolvedValue(mockLaunches);

      const result = await launchService.calculateNDTotal(ndId);

      expect(result).toBe(240.75);
      expect(launchService.getLaunchesByND).toHaveBeenCalledWith(ndId);
    });

    test('retorna 0 quando não há lançamentos', async () => {
      const ndId = 'nd-empty';

      jest.spyOn(launchService, 'getLaunchesByND').mockResolvedValue([]);

      const result = await launchService.calculateNDTotal(ndId);

      expect(result).toBe(0);
    });
  });

  describe('validateLaunchData', () => {
    test('valida dados corretos', () => {
       const validData = {
         ndId: 'nd-123',
         date: '2024-01-15',
         value: 75.50,
         category: 'Alimentação',
         imageUrl: 'https://example.com/image.jpg'
       };

       expect(() => launchService.validateLaunchData(validData)).not.toThrow();
     });

    test('lança erro para ndId ausente', () => {
       const invalidData = {
         date: '2024-01-15',
         value: 75.50,
         category: 'Alimentação'
       };

       expect(() => launchService.validateLaunchData(invalidData))
         .toThrow('Dados inválidos');
     });

    test('lança erro para data ausente', () => {
       const invalidData = {
         ndId: 'nd-123',
         value: 75.50,
         category: 'Alimentação'
       };

       expect(() => launchService.validateLaunchData(invalidData))
         .toThrow('Dados inválidos');
     });

     test('lança erro para valor inválido', () => {
       const invalidData = {
         ndId: 'nd-123',
         date: '2024-01-15',
         value: -10,
         category: 'Alimentação'
       };

       expect(() => launchService.validateLaunchData(invalidData))
         .toThrow('Dados inválidos');
     });

     test('lança erro para categoria ausente', () => {
       const invalidData = {
         ndId: 'nd-123',
         date: '2024-01-15',
         value: 75.50
       };

       expect(() => launchService.validateLaunchData(invalidData))
         .toThrow('Dados inválidos');
     });
  });
});