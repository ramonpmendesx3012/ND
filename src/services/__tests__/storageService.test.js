// Testes para storageService
import { storageService } from '../storageService.js';

// Mock do apiClient
jest.mock('../../config/apiClient.js', () => ({
  apiClient: {
    upload: jest.fn()
  }
}));

import { apiClient } from '../../config/apiClient.js';

describe('storageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    test('faz upload de imagem com sucesso', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        data: {
          publicUrl: 'https://storage.supabase.co/bucket/images/test-uuid-test.jpg'
        }
      };

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdCBjb250ZW50',
        onload: null,
        onerror: null
      };

      global.FileReader = jest.fn(() => mockFileReader);

      apiClient.upload.mockResolvedValue(mockResponse);

      // Simular o comportamento do FileReader
      const uploadPromise = storageService.uploadImage(mockFile);
      
      // Simular onload do FileReader
      setTimeout(() => {
        mockFileReader.onload();
      }, 0);

      const result = await uploadPromise;

      expect(result).toBe(mockResponse.data.publicUrl);
      expect(apiClient.upload).toHaveBeenCalledWith('dGVzdCBjb250ZW50', 'test.jpg');
    });

    test('lança erro quando upload falha', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onload: null,
        onerror: null
      };

      global.FileReader = jest.fn(() => mockFileReader);

      apiClient.upload.mockRejectedValue(new Error('Upload failed'));

      const uploadPromise = storageService.uploadImage(mockFile);
      
      setTimeout(() => {
        mockFileReader.onload();
      }, 0);

      await expect(uploadPromise).rejects.toThrow('Upload failed');
    });

    test('lança erro quando FileReader falha', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null,
        onerror: null
      };

      global.FileReader = jest.fn(() => mockFileReader);

      const uploadPromise = storageService.uploadImage(mockFile);
      
      // Simular erro do FileReader
      setTimeout(() => {
        mockFileReader.onerror(new Error('FileReader error'));
      }, 0);

      await expect(uploadPromise).rejects.toThrow('Erro ao ler arquivo');
    });

    test('valida tipo de arquivo', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(storageService.uploadImage(invalidFile))
        .rejects.toThrow('Tipo de arquivo não permitido');
    });

    test('valida tamanho do arquivo', async () => {
      // Criar arquivo muito grande (mock)
      const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg'
      });

      await expect(storageService.uploadImage(largeFile))
        .rejects.toThrow('Arquivo muito grande');
    });
  });

  describe('validateFile', () => {
    test('valida arquivo correto', () => {
      const validFile = new File(['test'], 'test.jpg', {
        type: 'image/jpeg'
      });

      expect(() => storageService.validateFile(validFile)).not.toThrow();
    });

    test('rejeita arquivo nulo', () => {
      expect(() => storageService.validateFile(null))
        .toThrow('Nenhum arquivo fornecido');
    });

    test('rejeita tipo não suportado', () => {
      const invalidFile = new File(['test'], 'test.pdf', {
        type: 'application/pdf'
      });

      expect(() => storageService.validateFile(invalidFile))
        .toThrow('Tipo de arquivo não permitido');
    });

    test('rejeita arquivo muito grande', () => {
      const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      expect(() => storageService.validateFile(largeFile))
        .toThrow('Arquivo muito grande');
    });
  });

  describe('formatFileSize', () => {
    test('formata tamanhos corretamente', () => {
      expect(storageService.formatFileSize(0)).toBe('0 Bytes');
      expect(storageService.formatFileSize(1024)).toBe('1 KB');
      expect(storageService.formatFileSize(1048576)).toBe('1 MB');
      expect(storageService.formatFileSize(1073741824)).toBe('1 GB');
    });

    test('lida com valores decimais', () => {
      expect(storageService.formatFileSize(1536)).toBe('1.5 KB');
      expect(storageService.formatFileSize(2621440)).toBe('2.5 MB');
    });

    test('lida com valores muito pequenos', () => {
      expect(storageService.formatFileSize(512)).toBe('512 Bytes');
      expect(storageService.formatFileSize(1)).toBe('1 Bytes');
    });
  });

  describe('getFileInfo', () => {
    test('retorna informações do arquivo', () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const info = storageService.getFileInfo(file);
      
      expect(info).toHaveProperty('name', 'test.jpg');
      expect(info).toHaveProperty('type', 'image/jpeg');
      expect(info).toHaveProperty('size');
      expect(info).toHaveProperty('sizeFormatted');
    });
  });

  describe('createPreviewUrl', () => {
    test('cria URL de preview', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const url = storageService.createPreviewUrl(file);
      
      expect(url).toMatch(/^blob:/);
    });
  });
});