// Serviço para geração de relatórios Excel
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatDate } from '../utils/formatDate.js';

class ReportService {
  /**
   * Gera e baixa um arquivo Excel com os dados da ND
   * @param {Array} expenses - Lista de despesas
   * @param {string} ndNumber - Número da ND
   * @param {string} description - Descrição da ND
   * @param {number} total - Total das despesas
   * @param {number} adiantamento - Valor do adiantamento
   */
  async generateExcelFile(expenses, ndNumber, description, total, adiantamento) {
    try {
      console.log('Gerando arquivo Excel...');
      
      // Verificar se ExcelJS está disponível
      if (typeof ExcelJS === 'undefined') {
        throw new Error('ExcelJS não está carregado');
      }

      // Criar workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatório de Despesas');

      // Configurar propriedades do documento
      workbook.creator = 'ND Express';
      workbook.lastModifiedBy = 'ND Express';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Adicionar cabeçalho
      this.addHeader(worksheet, ndNumber, description);
      
      // Adicionar dados das despesas
      this.addExpensesData(worksheet, expenses);
      
      // Adicionar resumo financeiro
      this.addFinancialSummary(worksheet, total, adiantamento, expenses.length);
      
      // Aplicar formatação
      this.applyFormatting(worksheet);
      
      // Gerar e baixar arquivo
      await this.downloadFile(workbook, ndNumber);
      
      console.log('Arquivo Excel gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar arquivo Excel:', error);
      throw error;
    }
  }

  /**
   * Adiciona cabeçalho ao relatório
   * @param {Object} worksheet - Planilha do Excel
   * @param {string} ndNumber - Número da ND
   * @param {string} description - Descrição da ND
   */
  addHeader(worksheet, ndNumber, description) {
    // Título principal
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'RELATÓRIO DE DESPESAS DE VIAGEM';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Informações da ND
    worksheet.getCell('A3').value = 'Número da ND:';
    worksheet.getCell('B3').value = ndNumber;
    worksheet.getCell('A4').value = 'Descrição:';
    worksheet.getCell('B4').value = description;
    worksheet.getCell('A5').value = 'Data de Geração:';
    worksheet.getCell('B5').value = formatDate(new Date());
    
    // Estilo para labels
    ['A3', 'A4', 'A5'].forEach(cell => {
      worksheet.getCell(cell).font = { bold: true };
    });
  }

  /**
   * Adiciona dados das despesas
   * @param {Object} worksheet - Planilha do Excel
   * @param {Array} expenses - Lista de despesas
   */
  addExpensesData(worksheet, expenses) {
    const startRow = 7;
    
    // Cabeçalhos das colunas
    const headers = ['Data', 'Categoria', 'Descrição', 'Valor', 'Comprovante'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
    });

    // Dados das despesas
    expenses.forEach((expense, index) => {
      const row = startRow + 1 + index;
      
      worksheet.getCell(row, 1).value = formatDate(expense.date);
      worksheet.getCell(row, 2).value = expense.category;
      worksheet.getCell(row, 3).value = expense.description;
      worksheet.getCell(row, 4).value = expense.value;
      worksheet.getCell(row, 4).numFmt = 'R$ #,##0.00';
      
      // Link para o comprovante (se disponível)
      if (expense.imageUrl && expense.imageUrl !== 'https://via.placeholder.com/150') {
        const cell = worksheet.getCell(row, 5);
        cell.value = 'Ver Comprovante';
        cell.font = { color: { argb: 'FF0000FF' }, underline: true };
        
        try {
          cell.value = {
            text: 'Ver Comprovante',
            hyperlink: expense.imageUrl
          };
        } catch (error) {
          cell.value = 'Comprovante Disponível';
        }
      } else {
          worksheet.getCell(row, 5).value = 'Sem comprovante';
        }
    });
  }

  /**
   * Adiciona resumo financeiro
   * @param {Object} worksheet - Planilha do Excel
   * @param {number} total - Total das despesas
   * @param {number} adiantamento - Valor do adiantamento
   * @param {number} expenseCount - Quantidade de despesas
   */
  addFinancialSummary(worksheet, total, adiantamento, expenseCount) {
    const summaryStartRow = 7 + expenseCount + 3;
    
    // Título do resumo
    worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);
    worksheet.getCell(summaryStartRow, 1).value = 'RESUMO FINANCEIRO';
    worksheet.getCell(summaryStartRow, 1).font = { bold: true, size: 14 };
    
    // Dados do resumo
    const summaryData = [
      ['Quantidade de Despesas:', expenseCount],
      ['Total de Despesas:', total],
      ['Valor do Adiantamento:', adiantamento],
      ['Saldo (Reembolso/Devolução):', total - adiantamento]
    ];
    
    summaryData.forEach((item, index) => {
      const row = summaryStartRow + 2 + index;
      worksheet.getCell(row, 1).value = item[0];
      worksheet.getCell(row, 1).font = { bold: true };
      
      if (typeof item[1] === 'number' && index > 0) {
        worksheet.getCell(row, 2).value = item[1];
        worksheet.getCell(row, 2).numFmt = 'R$ #,##0.00';
      } else {
        worksheet.getCell(row, 2).value = item[1];
      }
    });
    
    // Destacar saldo final
    const saldoRow = summaryStartRow + 5;
    worksheet.getCell(saldoRow, 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: total - adiantamento >= 0 ? 'FF90EE90' : 'FFFFA07A' }
    };
    worksheet.getCell(saldoRow, 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: total - adiantamento >= 0 ? 'FF90EE90' : 'FFFFA07A' }
    };
  }

  /**
   * Aplica formatação geral à planilha
   * @param {Object} worksheet - Planilha do Excel
   */
  applyFormatting(worksheet) {
    // Ajustar largura das colunas
    const columnWidths = [12, 15, 30, 15, 18];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });
    
    // Adicionar bordas
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 7) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });
  }

  /**
   * Gera e baixa o arquivo Excel
   * @param {Object} workbook - Workbook do Excel
   * @param {string} ndNumber - Número da ND
   */
  async downloadFile(workbook, ndNumber) {
    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Criar blob
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    // Criar link de download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ndNumber}_Relatorio_Despesas_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Fazer download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL
    URL.revokeObjectURL(url);
  }

  /**
   * Gera relatório em formato CSV (alternativo)
   * @param {Array} expenses - Lista de despesas
   * @param {string} ndNumber - Número da ND
   * @param {string} description - Descrição da ND
   * @param {number} total - Total das despesas
   * @param {number} adiantamento - Valor do adiantamento
   */
  generateCSVFile(expenses, ndNumber, description, total, adiantamento) {
    try {
      let csv = 'Data,Categoria,Descrição,Valor\n';
      
      expenses.forEach(expense => {
        csv += `${formatDate(expense.date)},${expense.category},"${expense.description}",${expense.value}\n`;
      });
      
      csv += `\n\nResumo Financeiro\n`;
      csv += `Total de Despesas,${total}\n`;
      csv += `Valor do Adiantamento,${adiantamento}\n`;
      csv += `Saldo,${total - adiantamento}\n`;
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${ndNumber}_Relatorio_Despesas.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar arquivo CSV:', error);
      throw error;
    }
  }
}

// Exportar instância única (singleton)
export const reportService = new ReportService();
export default reportService;