// Serviço para upload e gerenciamento de imagens
import { apiClient } from '../config/apiClient.js';
import { FILE_CONFIG } from '../utils/constants.js';

class StorageService {
  /**
   * Faz upload de uma imagem para o Supabase Storage
   * @param {File} file - Arquivo de imagem
   * @returns {Promise<string>} URL pública da imagem
   */
  async uploadImage(file) {
    try {
      // Validar arquivo
      this.validateFile(file);
      
      // Converter arquivo para base64
      const base64 = await this.fileToBase64(file);
      
      // Fazer upload via API
      const response = await apiClient.upload(base64, file.name);
      
      return response.data.publicUrl;
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      throw error;
    }
  }

  /**
   * Converte arquivo para base64
   * @param {File} file - Arquivo a ser convertido
   * @returns {Promise<string>} String base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const result = reader.result;
          // Extrair apenas a parte base64 (sem o prefixo data:image/...;base64,)
          const base64 = result.split(',')[1];
          resolve(base64);
        } catch (error) {
          reject(new Error('Erro ao processar arquivo'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Valida um arquivo de imagem
   * @param {File} file - Arquivo a ser validado
   * @throws {Error} Se o arquivo for inválido
   */
  validateFile(file) {
    if (!file) {
      throw new Error('Nenhum arquivo fornecido');
    }

    // Validar tipo de arquivo
    if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Tipo de arquivo não permitido. Tipos aceitos: ${FILE_CONFIG.ALLOWED_TYPES.join(', ')}`
      );
    }

    // Validar extensão
    const extension = file.name.split('.').pop().toLowerCase();
    if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(
        `Extensão de arquivo não permitida. Extensões aceitas: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    // Validar tamanho
    if (file.size > FILE_CONFIG.MAX_SIZE) {
      const maxSizeMB = FILE_CONFIG.MAX_SIZE / (1024 * 1024);
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
    }
  }

  /**
   * Obtém informações de um arquivo
   * @param {File} file - Arquivo
   * @returns {Object} Informações do arquivo
   */
  getFileInfo(file) {
    if (!file) return null;

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension: file.name.split('.').pop().toLowerCase(),
      sizeFormatted: this.formatFileSize(file.size)
    };
  }

  /**
   * Formata o tamanho do arquivo para exibição
   * @param {number} bytes - Tamanho em bytes
   * @returns {string} Tamanho formatado
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cria uma URL de preview para um arquivo
   * @param {File} file - Arquivo de imagem
   * @returns {string} URL de preview
   */
  createPreviewUrl(file) {
    if (!file || !file.type.startsWith('image/')) {
      return null;
    }

    return URL.createObjectURL(file);
  }

  /**
   * Libera uma URL de preview criada anteriormente
   * @param {string} url - URL a ser liberada
   */
  revokePreviewUrl(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Redimensiona uma imagem (se necessário)
   * @param {File} file - Arquivo de imagem
   * @param {number} maxWidth - Largura máxima
   * @param {number} maxHeight - Altura máxima
   * @param {number} quality - Qualidade (0-1)
   * @returns {Promise<Blob>} Imagem redimensionada
   */
  async resizeImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Redimensionar
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(resolve, file.type, quality);
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Exportar instância única (singleton)
export const storageService = new StorageService();
export default storageService;