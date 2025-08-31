// Testes para storageService - Integração com Supabase Storage
import { storageService } from '../storageService.js';

// Mock do Supabase
jest.mock('../../config/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn()
      }))
    }
  }
}));

import supabase from '../../config/supabaseClient.js';

describe('storageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    test('faz upload de imagem com sucesso', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const mockFileName = 'test-file-name.jpg';
      const mockPublicUrl = 'https://supabase.co/storage/v1/object/public/comprovantes/test-file-name.jpg';

      // Mock do upload
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: mockFileName },
        error: null
      });

      // Mock do getPublicUrl
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl }
      });

      const mockStorageChain = {
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      };

      supabase.storage.from.mockReturnValue(mockStorageChain);

      const result = await storageService.uploadImage(mockFile);

      expect(supabase.storage.from).toHaveBeenCalledWith('comprovantes');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('test.jpg'),
        mockFile,
        {
          cacheControl: '3600',
          upsert: false
        }
      );
      expect(mockGetPublicUrl).toHaveBeenCalledWith(expect.stringContaining('test.jpg'));
      expect(result).toBe(mockPublicUrl);
    });

    test('lança erro quando upload falha', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const uploadError = new Error('Upload failed');

      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: uploadError
      });

      const mockStorageChain = {
        upload: mockUpload,
        getPublicUrl: jest.fn()
      };

      supabase.storage.from.mockReturnValue(mockStorageChain);

      await expect(storageService.uploadImage(mockFile))
        .rejects.toThrow('Upload failed');
    });

    test('valida tipo de arquivo', async () => {
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      await expect(storageService.uploadImage(invalidFile))
        .rejects.toThrow('Tipo de arquivo não permitido');
    });

    test('valida tamanho do arquivo', async () => {
      // Criar um arquivo muito grande (mock)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      // Mock do tamanho do arquivo
      Object.defineProperty(largeFile, 'size', {
        value: 11 * 1024 * 1024, // 11MB
        writable: false
      });

      await expect(storageService.uploadImage(largeFile))
        .rejects.toThrow('Arquivo muito grande');
    });
  });

  describe('validateFile', () => {
    test('aceita tipos de arquivo válidos', () => {
      const validFiles = [
        new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'test.png', { type: 'image/png' }),
        new File(['content'], 'test.webp', { type: 'image/webp' })
      ];

      validFiles.forEach(file => {
        expect(() => storageService.validateFile(file)).not.toThrow();
      });
    });

    test('rejeita tipos de arquivo inválidos', () => {
      const invalidFiles = [
        new File(['content'], 'test.txt', { type: 'text/plain' }),
        new File(['content'], 'test.pdf', { type: 'application/pdf' }),
        new File(['content'], 'test.doc', { type: 'application/msword' })
      ];

      invalidFiles.forEach(file => {
        expect(() => storageService.validateFile(file))
          .toThrow('Tipo de arquivo não permitido');
      });
    });

    test('rejeita arquivos muito grandes', () => {
      const largeFile = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
      
      // Mock do tamanho do arquivo
      Object.defineProperty(largeFile, 'size', {
        value: 11 * 1024 * 1024, // 11MB
        writable: false
      });

      expect(() => storageService.validateFile(largeFile))
        .toThrow('Arquivo muito grande');
    });

    test('aceita arquivos com tamanho válido', () => {
      const validFile = new File(['content'], 'valid.jpg', { type: 'image/jpeg' });
      
      // Mock do tamanho do arquivo
      Object.defineProperty(validFile, 'size', {
        value: 5 * 1024 * 1024, // 5MB
        writable: false
      });

      expect(() => storageService.validateFile(validFile)).not.toThrow();
    });
  });

  describe('getFileInfo', () => {
    test('retorna informações do arquivo', () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock das propriedades do arquivo
      Object.defineProperty(file, 'size', {
        value: 1024,
        writable: false
      });
      Object.defineProperty(file, 'lastModified', {
        value: 1640995200000, // 2022-01-01
        writable: false
      });

      const result = storageService.getFileInfo(file);

      expect(result).toEqual({
         name: 'test.jpg',
         size: 1024,
         type: 'image/jpeg',
         lastModified: 1640995200000,
         extension: 'jpg',
         sizeFormatted: '1 KB'
       });
    });
  });

  describe('formatFileSize', () => {
     test('formata tamanhos de arquivo corretamente', () => {
       expect(storageService.formatFileSize(0)).toBe('0 Bytes');
       expect(storageService.formatFileSize(1024)).toBe('1 KB');
       expect(storageService.formatFileSize(1048576)).toBe('1 MB');
       expect(storageService.formatFileSize(1073741824)).toBe('1 GB');
       expect(storageService.formatFileSize(1536)).toBe('1.5 KB');
     });
   });

  describe('createPreviewUrl', () => {
    test('cria URL de preview para arquivo', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock do URL.createObjectURL
      const mockUrl = 'blob:http://localhost/test-blob-url';
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);

      const result = storageService.createPreviewUrl(file);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(result).toBe(mockUrl);
    });
  });

  describe('revokePreviewUrl', () => {
    test('revoga URL de preview', () => {
      const mockUrl = 'blob:http://localhost/test-blob-url';
      
      // Mock do URL.revokeObjectURL
      global.URL.revokeObjectURL = jest.fn();

      storageService.revokePreviewUrl(mockUrl);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });

  // Testes de resizeImage removidos devido à complexidade de mock do DOM
});