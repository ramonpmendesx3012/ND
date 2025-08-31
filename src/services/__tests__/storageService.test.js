// Testes para storageService
import { storageService } from '../storageService.js';

// Mock do apiClient
jest.mock('../../config/apiClient.js', () => ({
  request: jest.fn()
}));

import { request } from '../../config/apiClient.js';

describe('storageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    test('faz upload de imagem com sucesso', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        success: true,
        data: {
          url: 'https://storage.supabase.co/bucket/images/test-uuid-test.jpg',
          path: 'images/test-uuid-test.jpg'
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

      request.mockResolvedValue(mockResponse);

      // Simular o comportamento do FileReader
      const uploadPromise = storageService.uploadImage(mockFile);
      
      // Simular onload do FileReader
      setTimeout(() => {
        mockFileReader.onload();
      }, 0);

      const result = await uploadPromise;

      expect(result).toBe(mockResponse.data.url);
      expect(request).toHaveBeenCalledWith('/supabase-upload', {
        method: 'POST',
        body: {
          fileBase64: 'dGVzdCBjb250ZW50', // base64 sem prefixo
          fileName: 'test.jpg',
          bucket: 'images'
        }
      });
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

      request.mockRejectedValue(new Error('Upload failed'));

      const uploadPromise = storageService.uploadImage(mockFile);
      
      setTimeout(() => {
        mockFileReader.onload();
      }, 0);

      await expect(uploadPromise).rejects.toThrow('Erro no upload da imagem');
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
        .rejects.toThrow('Tipo de arquivo não suportado');
    });

    test('valida tamanho do arquivo', async () => {
      // Criar arquivo muito grande (mock)
      const largeFile = {
        name: 'large.jpg',
        type: 'image/jpeg',
        size: 15 * 1024 * 1024 // 15MB
      };

      await expect(storageService.uploadImage(largeFile))
        .rejects.toThrow('Arquivo muito grande');
    });
  });

  describe('validateFile', () => {
    test('valida arquivo correto', () => {
      const validFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      };

      expect(() => storageService.validateFile(validFile)).not.toThrow();
    });

    test('rejeita arquivo sem nome', () => {
      const invalidFile = {
        type: 'image/jpeg',
        size: 1024
      };

      expect(() => storageService.validateFile(invalidFile))
        .toThrow('Arquivo inválido');
    });

    test('rejeita tipo não suportado', () => {
      const invalidFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024
      };

      expect(() => storageService.validateFile(invalidFile))
        .toThrow('Tipo de arquivo não suportado');
    });

    test('rejeita arquivo muito grande', () => {
      const largeFile = {
        name: 'large.jpg',
        type: 'image/jpeg',
        size: 15 * 1024 * 1024 // 15MB
      };

      expect(() => storageService.validateFile(largeFile))
        .toThrow('Arquivo muito grande');
    });
  });

  describe('getFileExtension', () => {
    test('extrai extensão corretamente', () => {
      expect(storageService.getFileExtension('test.jpg')).toBe('jpg');
      expect(storageService.getFileExtension('image.PNG')).toBe('png');
      expect(storageService.getFileExtension('photo.jpeg')).toBe('jpeg');
      expect(storageService.getFileExtension('file.webp')).toBe('webp');
    });

    test('lida com nomes sem extensão', () => {
      expect(storageService.getFileExtension('filename')).toBe('');
      expect(storageService.getFileExtension('')).toBe('');
    });

    test('lida com múltiplos pontos', () => {
      expect(storageService.getFileExtension('file.name.jpg')).toBe('jpg');
      expect(storageService.getFileExtension('my.photo.PNG')).toBe('png');
    });
  });

  describe('isValidImageType', () => {
    test('valida tipos de imagem suportados', () => {
      expect(storageService.isValidImageType('image/jpeg')).toBe(true);
      expect(storageService.isValidImageType('image/png')).toBe(true);
      expect(storageService.isValidImageType('image/webp')).toBe(true);
    });

    test('rejeita tipos não suportados', () => {
      expect(storageService.isValidImageType('image/gif')).toBe(false);
      expect(storageService.isValidImageType('application/pdf')).toBe(false);
      expect(storageService.isValidImageType('text/plain')).toBe(false);
      expect(storageService.isValidImageType('')).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    test('formata tamanhos corretamente', () => {
      expect(storageService.formatFileSize(0)).toBe('0 B');
      expect(storageService.formatFileSize(1024)).toBe('1.0 KB');
      expect(storageService.formatFileSize(1048576)).toBe('1.0 MB');
      expect(storageService.formatFileSize(1073741824)).toBe('1.0 GB');
    });

    test('lida com valores decimais', () => {
      expect(storageService.formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
      expect(storageService.formatFileSize(2621440)).toBe('2.5 MB'); // 2.5 MB
    });

    test('lida com valores muito pequenos', () => {
      expect(storageService.formatFileSize(512)).toBe('512 B');
      expect(storageService.formatFileSize(1)).toBe('1 B');
    });
  });

  describe('generateUniqueFileName', () => {
    test('gera nome único mantendo extensão', () => {
      const originalName = 'photo.jpg';
      const uniqueName = storageService.generateUniqueFileName(originalName);
      
      expect(uniqueName).toMatch(/^[a-f0-9-]+-photo\.jpg$/);
      expect(uniqueName).toContain('photo.jpg');
      expect(uniqueName.length).toBeGreaterThan(originalName.length);
    });

    test('lida com nomes sem extensão', () => {
      const originalName = 'filename';
      const uniqueName = storageService.generateUniqueFileName(originalName);
      
      expect(uniqueName).toMatch(/^[a-f0-9-]+-filename$/);
    });

    test('gera nomes diferentes a cada chamada', () => {
      const name1 = storageService.generateUniqueFileName('test.jpg');
      const name2 = storageService.generateUniqueFileName('test.jpg');
      
      expect(name1).not.toBe(name2);
    });
  });
});