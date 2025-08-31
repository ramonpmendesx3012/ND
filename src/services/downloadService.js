// Serviço para download de comprovantes em ZIP
import { formatDate } from '../utils/formatDate.js';

class DownloadService {
  /**
   * Baixa todos os comprovantes de uma ND em um arquivo ZIP
   * @param {Array} expenses - Lista de despesas
   * @param {string} ndNumber - Número da ND
   * @returns {Promise<void>}
   */
  async downloadAllReceipts(expenses, ndNumber) {
    try {
      console.log('Iniciando download de comprovantes...');
      
      // Verificar se há despesas com imagens válidas
      const expensesWithImages = expenses.filter(expense => {
        if (!expense.imageUrl) return false;
        if (expense.imageUrl === 'https://via.placeholder.com/150') return false;
        if (expense.imageUrl.includes('placeholder')) return false;
        if (expense.imageUrl.startsWith('blob:')) {
          // URLs blob locais não podem ser baixadas em ZIP
          console.warn('Imagem local (blob) detectada, pulando:', expense.imageUrl);
          return false;
        }
        return true;
      });
      
      if (expensesWithImages.length === 0) {
        throw new Error('Nenhum comprovante encontrado para download');
      }
      
      // Verificar se JSZip está disponível
      if (typeof JSZip === 'undefined') {
        // Carregar JSZip dinamicamente
        await this.loadJSZip();
      }
      
      const zip = new JSZip();
      const folder = zip.folder(`Comprovantes_${ndNumber}`);
      
      // Baixar e adicionar cada imagem ao ZIP
      const downloadPromises = expensesWithImages.map(async (expense, index) => {
        try {
          const response = await fetch(expense.imageUrl);
          if (!response.ok) {
            console.warn(`Erro ao baixar comprovante ${index + 1}:`, response.statusText);
            return null;
          }
          
          const blob = await response.blob();
          const extension = this.getFileExtension(expense.imageUrl, blob.type);
          const fileName = this.generateFileName(expense, index + 1, extension);
          
          folder.file(fileName, blob);
          return fileName;
        } catch (error) {
          console.warn(`Erro ao processar comprovante ${index + 1}:`, error);
          return null;
        }
      });
      
      // Aguardar todos os downloads
      const results = await Promise.all(downloadPromises);
      const successCount = results.filter(result => result !== null).length;
      
      if (successCount === 0) {
        throw new Error('Não foi possível baixar nenhum comprovante');
      }
      
      // Adicionar arquivo de índice
      const indexContent = this.generateIndexFile(expensesWithImages, results);
      folder.file('INDICE.txt', indexContent);
      
      // Gerar e baixar o ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Fazer download
      this.downloadBlob(zipBlob, `${ndNumber}_Comprovantes.zip`);
      
      console.log(`Download concluído: ${successCount} de ${expensesWithImages.length} comprovantes`);
      return { success: true, downloaded: successCount, total: expensesWithImages.length };
      
    } catch (error) {
      console.error('Erro no download de comprovantes:', error);
      throw error;
    }
  }
  
  /**
   * Carrega a biblioteca JSZip dinamicamente
   */
  async loadJSZip() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Erro ao carregar JSZip'));
      document.head.appendChild(script);
    });
  }
  
  /**
   * Obtém a extensão do arquivo baseada na URL ou tipo MIME
   * @param {string} url - URL da imagem
   * @param {string} mimeType - Tipo MIME do blob
   * @returns {string} Extensão do arquivo
   */
  getFileExtension(url, mimeType) {
    // Tentar extrair da URL primeiro
    const urlExtension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExtension)) {
      return urlExtension;
    }
    
    // Usar tipo MIME como fallback
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif'
    };
    
    return mimeMap[mimeType] || 'jpg';
  }
  
  /**
   * Gera nome do arquivo para o comprovante
   * @param {Object} expense - Dados da despesa
   * @param {number} index - Índice do arquivo
   * @param {string} extension - Extensão do arquivo
   * @returns {string} Nome do arquivo
   */
  generateFileName(expense, index, extension) {
    const date = formatDate(expense.date).replace(/\//g, '-');
    const category = expense.category.replace(/[^a-zA-Z0-9]/g, '_');
    const value = expense.value.toFixed(2).replace('.', ',');
    
    return `${String(index).padStart(2, '0')}_${date}_${category}_R$${value}.${extension}`;
  }
  
  /**
   * Gera arquivo de índice com informações das despesas
   * @param {Array} expenses - Lista de despesas
   * @param {Array} fileNames - Nomes dos arquivos baixados
   * @returns {string} Conteúdo do arquivo de índice
   */
  generateIndexFile(expenses, fileNames) {
    let content = `ÍNDICE DE COMPROVANTES\n`;
    content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    content += `Total de comprovantes: ${fileNames.filter(f => f !== null).length}\n`;
    content += `\n${'='.repeat(80)}\n\n`;
    
    expenses.forEach((expense, index) => {
      const fileName = fileNames[index];
      const status = fileName ? '✓' : '✗';
      
      content += `${status} Comprovante ${index + 1}:\n`;
      content += `   Data: ${formatDate(expense.date)}\n`;
      content += `   Categoria: ${expense.category}\n`;
      content += `   Descrição: ${expense.description}\n`;
      content += `   Valor: R$ ${expense.value.toFixed(2).replace('.', ',')}\n`;
      
      if (fileName) {
        content += `   Arquivo: ${fileName}\n`;
      } else {
        content += `   Status: Erro no download\n`;
      }
      
      content += `\n`;
    });
    
    content += `\n${'='.repeat(80)}\n`;
    content += `\nObservações:\n`;
    content += `- Os arquivos estão nomeados com: Número_Data_Categoria_Valor\n`;
    content += `- Formato de data: DD-MM-AAAA\n`;
    content += `- Valores em Reais (R$)\n`;
    content += `- Imagens em resolução original\n`;
    
    return content;
  }
  
  /**
   * Faz download de um blob
   * @param {Blob} blob - Blob para download
   * @param {string} fileName - Nome do arquivo
   */
  downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Adicionar ao DOM temporariamente
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL
    URL.revokeObjectURL(url);
  }
  
  /**
   * Verifica se há comprovantes disponíveis para download
   * @param {Array} expenses - Lista de despesas
   * @returns {Object} Informações sobre comprovantes disponíveis
   */
  checkAvailableReceipts(expenses) {
    const withImages = expenses.filter(expense => {
      if (!expense.imageUrl) return false;
      if (expense.imageUrl === 'https://via.placeholder.com/150') return false;
      if (expense.imageUrl.includes('placeholder')) return false;
      if (expense.imageUrl.startsWith('blob:')) return false;
      return true;
    });
    
    const withoutImages = expenses.filter(expense => {
      if (!expense.imageUrl) return true;
      if (expense.imageUrl === 'https://via.placeholder.com/150') return true;
      if (expense.imageUrl.includes('placeholder')) return true;
      if (expense.imageUrl.startsWith('blob:')) return true;
      return false;
    });
    
    return {
      total: expenses.length,
      withImages: withImages.length,
      withoutImages: withoutImages.length,
      hasDownloadableReceipts: withImages.length > 0
    };
  }
  
  /**
   * Estima o tamanho do download
   * @param {Array} expenses - Lista de despesas
   * @returns {string} Estimativa de tamanho formatada
   */
  estimateDownloadSize(expenses) {
    const expensesWithImages = expenses.filter(expense => 
      expense.imageUrl && 
      expense.imageUrl !== 'https://via.placeholder.com/150'
    );
    
    // Estimativa: ~500KB por imagem (média)
    const estimatedBytes = expensesWithImages.length * 500 * 1024;
    
    if (estimatedBytes < 1024 * 1024) {
      return `${Math.round(estimatedBytes / 1024)} KB`;
    } else {
      return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
}

// Exportar instância única (singleton)
export const downloadService = new DownloadService();
export default downloadService;