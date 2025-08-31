// Componente principal da aplicação ND Express
import Header from './components/Header/Header.js';
import { showLoading, hideLoading } from './components/LoadingOverlay/LoadingOverlay.js';
import Button from './components/common/Button.js';
import Input from './components/common/Input.js';

import { ndService } from './services/ndService.js';
import { launchService } from './services/launchService.js';
import { storageService } from './services/storageService.js';
import { reportService } from './services/reportService.js';

import { formatCurrency } from './utils/formatCurrency.js';
import { formatDate, getCurrentDateForInput } from './utils/formatDate.js';
import { CATEGORY_OPTIONS, EXPENSE_CATEGORIES, CATEGORY_LIMITS, TIME_CATEGORIES, NOTIFICATION_TYPES } from './utils/constants.js';

class App {
  constructor() {
    // Estado da aplicação
    this.state = {
      currentNdId: null,
      ndCounter: 1,
      expenses: [],
      valorAdiantamento: 0,
      currentImageData: null,
      originalImageFile: null
    };

    // Componentes
    this.header = new Header();
    
    // Elementos DOM
    this.elements = {};
  }

  /**
   * Inicializa a aplicação
   */
  async init() {
    try {
      console.log('Inicializando ND Express...');
      
      // Renderizar interface
      this.render();
      
      // Configurar eventos
      this.bindEvents();
      
      // Carregar dados iniciais
      await this.loadInitialData();
      
      console.log('ND Express inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar aplicação:', error);
      this.showNotification('Erro ao inicializar aplicação', NOTIFICATION_TYPES.ERROR);
    }
  }

  /**
   * Renderiza a interface da aplicação
   */
  render() {
    const app = document.getElementById('app');
    if (!app) {
      console.error('Elemento #app não encontrado');
      return;
    }

    // Limpar conteúdo existente
    app.innerHTML = '';

    // Renderizar cabeçalho
    this.header.render(app);

    // Criar container principal
    const main = document.createElement('main');
    main.className = 'app-main';
    main.style.cssText = `
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-6) var(--spacing-4);
      display: grid;
      gap: var(--spacing-8);
      grid-template-columns: 1fr;
    `;

    // Renderizar seções
    main.appendChild(this.createTravelSection());
    main.appendChild(this.createExpenseForm());
    main.appendChild(this.createExpensesList());
    main.appendChild(this.createActionsSection());

    app.appendChild(main);

    // Adicionar estilos responsivos
    this.addResponsiveStyles();
  }

  /**
   * Cria a seção de informações da viagem
   */
  createTravelSection() {
    const section = document.createElement('section');
    section.className = 'card';
    
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = '<h2 style="margin: 0;">Informações da Viagem</h2>';
    
    const body = document.createElement('div');
    body.className = 'card-body';
    
    // Criar formulário de descrição da viagem
    const form = document.createElement('div');
    form.style.cssText = 'display: grid; gap: var(--spacing-4); grid-template-columns: 1fr auto;';
    
    const descriptionInput = Input.text('Descrição da Viagem', {
      id: 'travelDescription',
      placeholder: 'Ex: Viagem a São Paulo - Reunião com cliente',
      value: 'Nova Nota de Despesa'
    });
    
    const adiantamentoInput = Input.number('Valor do Adiantamento', {
      id: 'valorAdiantamento',
      placeholder: '0,00',
      value: '0.00',
      onChange: (value) => this.handleAdiantamentoChange(value)
    });
    
    form.appendChild(descriptionInput);
    form.appendChild(adiantamentoInput);
    
    body.appendChild(form);
    section.appendChild(header);
    section.appendChild(body);
    
    return section;
  }

  /**
   * Cria o formulário de despesas
   */
  createExpenseForm() {
    const section = document.createElement('section');
    section.className = 'card';
    
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = '<h2 style="margin: 0;">Adicionar Despesa</h2>';
    
    const body = document.createElement('div');
    body.className = 'card-body';
    
    // Criar formulário
    const form = document.createElement('form');
    form.id = 'expenseForm';
    form.style.cssText = 'display: grid; gap: var(--spacing-4);';
    
    // Linha 1: Data e Valor
    const row1 = document.createElement('div');
    row1.style.cssText = 'display: grid; gap: var(--spacing-4); grid-template-columns: 1fr 1fr;';
    
    const dateInput = Input.date('Data da Despesa', {
      id: 'expenseDate',
      required: true,
      value: getCurrentDateForInput()
    });
    
    const valueInput = Input.number('Valor', {
      id: 'expenseValue',
      placeholder: '0,00',
      required: true,
      validation: { min: 0.01, step: 0.01 }
    });
    
    row1.appendChild(dateInput);
    row1.appendChild(valueInput);
    
    // Linha 2: Categoria e Confiança
    const row2 = document.createElement('div');
    row2.style.cssText = 'display: grid; gap: var(--spacing-4); grid-template-columns: 1fr auto;';
    
    const categorySelect = Input.select('Categoria', CATEGORY_OPTIONS, {
      id: 'category',
      required: true
    });
    
    const confidenceInput = Input.number('Confiança (%)', {
      id: 'confidence',
      placeholder: '95',
      value: '95',
      validation: { min: 0, max: 100 }
    });
    
    row2.appendChild(categorySelect);
    row2.appendChild(confidenceInput);
    
    // Linha 3: Descrição
    const descriptionInput = Input.text('Descrição', {
      id: 'description',
      placeholder: 'Descrição da despesa'
    });
    
    // Linha 4: Upload de imagem
    const imageSection = this.createImageUploadSection();
    
    // Linha 5: Botões
    const buttonsRow = document.createElement('div');
    buttonsRow.style.cssText = 'display: flex; gap: var(--spacing-3); justify-content: flex-end;';
    
    const captureBtn = Button.primary('📸 Capturar Comprovante', () => this.handleImageCapture(), {
      id: 'captureBtn'
    });
    
    const confirmBtn = Button.success('✅ Confirmar Despesa', () => this.handleConfirmExpense(), {
      id: 'confirmBtn'
    });
    
    const clearBtn = Button.secondary('🧹 Limpar', () => this.handleClearForm(), {
      id: 'clearBtn'
    });
    
    buttonsRow.appendChild(clearBtn);
    buttonsRow.appendChild(captureBtn);
    buttonsRow.appendChild(confirmBtn);
    
    // Montar formulário
    form.appendChild(row1);
    form.appendChild(row2);
    form.appendChild(descriptionInput);
    form.appendChild(imageSection);
    form.appendChild(buttonsRow);
    
    body.appendChild(form);
    section.appendChild(header);
    section.appendChild(body);
    
    return section;
  }

  /**
   * Cria a seção de upload de imagem
   */
  createImageUploadSection() {
    const container = document.createElement('div');
    container.className = 'image-upload-section';
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Comprovante';
    
    const uploadArea = document.createElement('div');
    uploadArea.style.cssText = `
      border: 2px dashed var(--gray-300);
      border-radius: var(--border-radius);
      padding: var(--spacing-6);
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    `;
    
    uploadArea.innerHTML = `
      <div class="upload-placeholder">
        <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">📁</div>
        <p style="margin: 0; color: var(--gray-600);">Clique para selecionar ou arraste uma imagem</p>
        <p style="margin: 0; font-size: var(--font-size-sm); color: var(--gray-500);">PNG, JPG ou WebP até 10MB</p>
      </div>
    `;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
    
    container.appendChild(label);
    container.appendChild(uploadArea);
    container.appendChild(fileInput);
    
    return container;
  }

  /**
   * Cria a lista de despesas
   */
  createExpensesList() {
    const section = document.createElement('section');
    section.className = 'card';
    
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = '<h2 style="margin: 0;">Lançamentos</h2>';
    
    const body = document.createElement('div');
    body.className = 'card-body';
    body.id = 'expensesList';
    
    section.appendChild(header);
    section.appendChild(body);
    
    return section;
  }

  /**
   * Cria a seção de ações
   */
  createActionsSection() {
    const section = document.createElement('section');
    section.className = 'card';
    
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = '<h2 style="margin: 0;">Ações</h2>';
    
    const body = document.createElement('div');
    body.className = 'card-body';
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = 'display: flex; gap: var(--spacing-3); justify-content: center; flex-wrap: wrap;';
    
    const exportBtn = Button.primary('📊 Exportar e Fechar ND', () => this.handleExportND());
    const cancelBtn = Button.error('❌ Cancelar ND', () => this.handleCancelND());
    
    buttonsContainer.appendChild(exportBtn);
    buttonsContainer.appendChild(cancelBtn);
    
    body.appendChild(buttonsContainer);
    section.appendChild(header);
    section.appendChild(body);
    
    return section;
  }

  /**
   * Configura eventos da aplicação
   */
  bindEvents() {
    // Eventos do formulário
    document.addEventListener('submit', (e) => e.preventDefault());
    
    // Eventos de teclado
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.handleConfirmExpense();
      }
    });
  }

  /**
   * Carrega dados iniciais da aplicação
   */
  async loadInitialData() {
    try {
      showLoading('Carregando dados...');
      
      // Buscar ND aberta
      const openND = await ndService.fetchOpenND();
      
      if (openND) {
        // Restaurar sessão existente
        await this.restoreSession(openND);
      } else {
        // Criar nova ND
        await this.createNewND();
      }
      
      this.updateInterface();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      this.showNotification('Erro ao carregar dados', NOTIFICATION_TYPES.ERROR);
    } finally {
      hideLoading();
    }
  }

  /**
   * Restaura uma sessão existente
   */
  async restoreSession(ndData) {
    console.log('Restaurando sessão:', ndData.numero_nd);
    
    this.state.currentNdId = ndData.id;
    this.state.ndCounter = parseInt(ndData.numero_nd.replace('ND', '')) || 1;
    this.state.valorAdiantamento = parseFloat(ndData.valor_adiantamento) || 0;
    
    // Carregar descrição
    const descriptionInput = document.getElementById('travelDescription');
    if (descriptionInput && ndData.descricao) {
      descriptionInput.value = ndData.descricao;
    }
    
    // Carregar adiantamento
    const adiantamentoInput = document.getElementById('valorAdiantamento');
    if (adiantamentoInput) {
      adiantamentoInput.value = this.state.valorAdiantamento.toFixed(2);
    }
    
    // Carregar lançamentos
    const launches = await launchService.getLaunchesByND(this.state.currentNdId);
    this.state.expenses = launchService.convertListToLocalFormat(launches);
  }

  /**
   * Cria uma nova ND
   */
  async createNewND() {
    const ndNumber = ndService.generateNextNDNumber(this.state.ndCounter);
    const newND = await ndService.createND(ndNumber);
    
    this.state.currentNdId = newND.id;
    this.state.expenses = [];
    this.state.valorAdiantamento = 0;
    
    console.log('Nova ND criada:', ndNumber);
  }

  /**
   * Atualiza a interface com os dados atuais
   */
  updateInterface() {
    const total = this.calculateTotal();
    const ndNumber = ndService.generateNextNDNumber(this.state.ndCounter);
    
    // Atualizar cabeçalho
    this.header.updateAll({
      ndNumber,
      total,
      adiantamento: this.state.valorAdiantamento
    });
    
    // Atualizar lista de despesas
    this.updateExpensesList();
  }

  /**
   * Calcula o total das despesas
   */
  calculateTotal() {
    return this.state.expenses.reduce((sum, expense) => sum + expense.value, 0);
  }

  /**
   * Atualiza a lista de despesas na interface
   */
  updateExpensesList() {
    const container = document.getElementById('expensesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.state.expenses.length === 0) {
      container.innerHTML = `
        <div style="
          text-align: center;
          padding: var(--spacing-8);
          color: var(--gray-500);
        ">
          <div style="font-size: 3rem; margin-bottom: var(--spacing-4);">📝</div>
          <p>Nenhuma despesa adicionada ainda</p>
          <p style="font-size: var(--font-size-sm);">Capture um comprovante para começar</p>
        </div>
      `;
      return;
    }
    
    // Criar grid de despesas
    const grid = document.createElement('div');
    grid.className = 'launch-grid';
    
    this.state.expenses.forEach(expense => {
      const item = this.createExpenseItem(expense);
      grid.appendChild(item);
    });
    
    container.appendChild(grid);
  }

  /**
   * Cria um item de despesa para a lista
   */
  createExpenseItem(expense) {
    const item = document.createElement('div');
    item.className = 'launch-item';
    
    item.innerHTML = `
      <div class="launch-header">
        <div class="launch-date">${formatDate(expense.date)}</div>
        <div class="launch-value">${formatCurrency(expense.value)}</div>
      </div>
      <div class="launch-category">${expense.category}</div>
      <div class="launch-description">${expense.description}</div>
      <div class="launch-actions">
        <button class="btn btn-sm btn-secondary" onclick="app.viewExpenseDetails('${expense.id}')">
          👁️ Ver
        </button>
        <button class="btn btn-sm btn-error" onclick="app.deleteExpense('${expense.id}')">
          🗑️ Excluir
        </button>
      </div>
    `;
    
    return item;
  }

  // === HANDLERS DE EVENTOS ===

  async handleAdiantamentoChange(value) {
    const numValue = parseFloat(value) || 0;
    this.state.valorAdiantamento = numValue;
    
    if (this.state.currentNdId) {
      try {
        await ndService.updateAdiantamento(this.state.currentNdId, numValue);
        this.header.updateAdiantamento(numValue);
      } catch (error) {
        console.error('Erro ao salvar adiantamento:', error);
      }
    }
  }

  handleImageCapture() {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.click();
    }
  }

  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      await this.processImageFile(file);
    }
  }

  handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.style.borderColor = 'var(--primary-color)';
    event.currentTarget.style.backgroundColor = 'var(--primary-light)';
  }

  async handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.style.borderColor = 'var(--gray-300)';
    event.currentTarget.style.backgroundColor = 'transparent';
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      await this.processImageFile(files[0]);
    }
  }

  async processImageFile(file) {
    try {
      showLoading('Processando imagem...');
      
      // Validar arquivo
      storageService.validateFile(file);
      
      // Converter para base64
      const base64 = await storageService.fileToBase64(file);
      
      // Armazenar dados
      this.state.originalImageFile = file;
      this.state.currentImageData = {
        base64: base64,
        fileName: file.name
      };
      
      // Atualizar interface
      this.updateImagePreview(file);
      
      // Analisar com IA
      await this.analyzeImageWithAI(base64);
      
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      this.showNotification(error.message, NOTIFICATION_TYPES.ERROR);
    } finally {
      hideLoading();
    }
  }

  updateImagePreview(file) {
    const uploadArea = document.querySelector('.image-upload-section div:nth-child(2)');
    if (!uploadArea) return;
    
    const previewUrl = storageService.createPreviewUrl(file);
    const fileInfo = storageService.getFileInfo(file);
    
    uploadArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--spacing-3);">
        <img src="${previewUrl}" alt="Preview" style="
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: var(--border-radius);
        ">
        <div style="text-align: left;">
          <p style="margin: 0; font-weight: 500;">${fileInfo.name}</p>
          <p style="margin: 0; font-size: var(--font-size-sm); color: var(--gray-500);">
            ${fileInfo.sizeFormatted}
          </p>
        </div>
        <button type="button" onclick="app.clearImage()" style="
          background: none;
          border: none;
          font-size: var(--font-size-lg);
          cursor: pointer;
          color: var(--error-color);
        ">❌</button>
      </div>
    `;
  }

  clearImage() {
    this.state.originalImageFile = null;
    this.state.currentImageData = null;
    
    const uploadArea = document.querySelector('.image-upload-section div:nth-child(2)');
    if (uploadArea) {
      uploadArea.innerHTML = `
        <div class="upload-placeholder">
          <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">📁</div>
          <p style="margin: 0; color: var(--gray-600);">Clique para selecionar ou arraste uma imagem</p>
          <p style="margin: 0; font-size: var(--font-size-sm); color: var(--gray-500);">PNG, JPG ou WebP até 10MB</p>
        </div>
      `;
    }
    
    // Limpar input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async analyzeImageWithAI(base64) {
    try {
      showLoading('Analisando comprovante com IA...');
      
      // Fazer análise via API
      const response = await fetch('/api/openai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });
      
      if (!response.ok) {
        throw new Error('Erro na análise da IA');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        this.populateFormWithAIData(result.data);
        this.showNotification('Comprovante analisado com sucesso!', NOTIFICATION_TYPES.SUCCESS);
      } else {
        throw new Error('Dados inválidos retornados pela IA');
      }
      
    } catch (error) {
      console.error('Erro na análise da IA:', error);
      this.showNotification('Erro na análise automática. Preencha manualmente.', NOTIFICATION_TYPES.WARNING);
    } finally {
      hideLoading();
    }
  }

  populateFormWithAIData(data) {
    // Preencher data
    if (data.date) {
      const dateInput = document.getElementById('expenseDate');
      if (dateInput) {
        dateInput.value = data.date;
      }
    }
    
    // Preencher valor (com aplicação de limites)
    if (data.value) {
      const valueInput = document.getElementById('expenseValue');
      if (valueInput) {
        const limitedValue = this.applyCategoryLimit(data.value, data.description, data.category);
        valueInput.value = limitedValue.toFixed(2);
      }
    }
    
    // Preencher categoria
    if (data.category) {
      const categorySelect = document.getElementById('category');
      if (categorySelect) {
        categorySelect.value = data.category;
      }
    }
    
    // Preencher descrição
    if (data.description) {
      const descriptionInput = document.getElementById('description');
      if (descriptionInput) {
        descriptionInput.value = data.description;
      }
    }
    
    // Preencher confiança
    if (data.confidence) {
      const confidenceInput = document.getElementById('confidence');
      if (confidenceInput) {
        confidenceInput.value = data.confidence;
      }
    }
  }

  applyCategoryLimit(value, description, category) {
    const numericValue = parseFloat(value) || 0;
    
    if (category === EXPENSE_CATEGORIES.ALIMENTACAO) {
      const descLower = (description || '').toLowerCase();
      
      if (descLower.includes('café') || descLower.includes('breakfast')) {
        return Math.min(numericValue, CATEGORY_LIMITS.CAFE_MANHA);
      } else if (descLower.includes('almoço') || descLower.includes('lunch')) {
        return Math.min(numericValue, CATEGORY_LIMITS.ALMOCO);
      } else if (descLower.includes('jantar') || descLower.includes('dinner')) {
        return Math.min(numericValue, CATEGORY_LIMITS.JANTAR);
      } else {
        return Math.min(numericValue, CATEGORY_LIMITS.ALIMENTACAO_GERAL);
      }
    }
    
    return numericValue;
  }

  async handleConfirmExpense() {
    try {
      // Validar formulário
      const formData = this.getFormData();
      this.validateFormData(formData);
      
      if (!this.state.currentNdId) {
        throw new Error('Nenhuma ND ativa encontrada');
      }
      
      showLoading('Salvando despesa...');
      
      // Upload da imagem
      let imageUrl = 'https://via.placeholder.com/150';
      if (this.state.originalImageFile && this.state.currentImageData) {
        imageUrl = await storageService.uploadImage(this.state.originalImageFile);
      }
      
      // Preparar dados para inserção
      const launchData = {
        ndId: this.state.currentNdId,
        date: formData.date,
        value: formData.value,
        description: formData.description,
        category: formData.category,
        imageUrl: imageUrl,
        confidence: formData.confidence
      };
      
      // Inserir no banco
      const newLaunch = await launchService.addLaunch(launchData);
      
      // Adicionar à lista local
      const localExpense = launchService.convertToLocalFormat(newLaunch);
      this.state.expenses.push(localExpense);
      
      // Atualizar interface
      this.updateInterface();
      this.clearForm();
      
      this.showNotification('Despesa adicionada com sucesso!', NOTIFICATION_TYPES.SUCCESS);
      
    } catch (error) {
      console.error('Erro ao confirmar despesa:', error);
      this.showNotification(error.message, NOTIFICATION_TYPES.ERROR);
    } finally {
      hideLoading();
    }
  }

  getFormData() {
    return {
      date: document.getElementById('expenseDate')?.value || '',
      value: parseFloat(document.getElementById('expenseValue')?.value) || 0,
      category: document.getElementById('category')?.value || '',
      description: document.getElementById('description')?.value || '',
      confidence: parseInt(document.getElementById('confidence')?.value) || 0
    };
  }

  validateFormData(data) {
    const errors = [];
    
    if (!data.date) errors.push('Data é obrigatória');
    if (!data.value || data.value <= 0) errors.push('Valor deve ser maior que zero');
    if (!data.category) errors.push('Categoria é obrigatória');
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  handleClearForm() {
    // Limpar campos
    document.getElementById('expenseDate').value = getCurrentDateForInput();
    document.getElementById('expenseValue').value = '';
    document.getElementById('category').value = '';
    document.getElementById('description').value = '';
    document.getElementById('confidence').value = '95';
    
    // Limpar imagem
    this.clearImage();
  }

  clearForm() {
    this.handleClearForm();
  }

  async deleteExpense(expenseId) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
      return;
    }
    
    try {
      showLoading('Excluindo despesa...');
      
      await launchService.deleteLaunch(expenseId);
      
      // Remover da lista local
      this.state.expenses = this.state.expenses.filter(exp => exp.id !== expenseId);
      
      // Atualizar interface
      this.updateInterface();
      
      this.showNotification('Despesa excluída com sucesso!', NOTIFICATION_TYPES.SUCCESS);
      
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      this.showNotification('Erro ao excluir despesa', NOTIFICATION_TYPES.ERROR);
    } finally {
      hideLoading();
    }
  }

  viewExpenseDetails(expenseId) {
    const expense = this.state.expenses.find(exp => exp.id === expenseId);
    if (!expense) return;
    
    // Implementar modal de detalhes
    alert(`Detalhes da despesa:\n\nData: ${formatDate(expense.date)}\nValor: ${formatCurrency(expense.value)}\nCategoria: ${expense.category}\nDescrição: ${expense.description}`);
  }

  async handleExportND() {
    if (this.state.expenses.length === 0) {
      this.showNotification('Nenhuma despesa para exportar', NOTIFICATION_TYPES.WARNING);
      return;
    }
    
    if (!confirm('Deseja fechar esta ND e exportar os dados?\n\nApós fechar, não será possível adicionar mais lançamentos.')) {
      return;
    }
    
    try {
      showLoading('Exportando ND...');
      
      const description = document.getElementById('travelDescription')?.value || 'Viagem de Negócios';
      const ndNumber = ndService.generateNextNDNumber(this.state.ndCounter);
      const total = this.calculateTotal();
      
      // Finalizar ND no banco
      await ndService.finalizeND(this.state.currentNdId, description);
      
      // Gerar relatório Excel
      await reportService.generateExcelFile(
        this.state.expenses,
        ndNumber,
        description,
        total,
        this.state.valorAdiantamento
      );
      
      this.showNotification(`ND ${ndNumber} fechada e exportada com sucesso!`, NOTIFICATION_TYPES.SUCCESS);
      
      // Preparar nova ND
      setTimeout(() => this.prepareNewND(), 2000);
      
    } catch (error) {
      console.error('Erro ao exportar ND:', error);
      this.showNotification('Erro ao exportar ND', NOTIFICATION_TYPES.ERROR);
    } finally {
      hideLoading();
    }
  }

  async handleCancelND() {
    if (!confirm('Tem certeza que deseja cancelar esta ND?\n\nTodos os lançamentos serão perdidos.')) {
      return;
    }
    
    try {
      showLoading('Cancelando ND...');
      
      // Excluir todos os lançamentos
      for (const expense of this.state.expenses) {
        await launchService.deleteLaunch(expense.id);
      }
      
      // Excluir ND
      // (implementar se necessário)
      
      // Preparar nova ND
      await this.prepareNewND();
      
      this.showNotification('ND cancelada com sucesso', NOTIFICATION_TYPES.SUCCESS);
      
    } catch (error) {
      console.error('Erro ao cancelar ND:', error);
      this.showNotification('Erro ao cancelar ND', NOTIFICATION_TYPES.ERROR);
    } finally {
      hideLoading();
    }
  }

  async prepareNewND() {
    // Limpar estado
    this.state.expenses = [];
    this.state.currentImageData = null;
    this.state.originalImageFile = null;
    this.state.ndCounter++;
    this.state.valorAdiantamento = 0;
    
    // Criar nova ND
    await this.createNewND();
    
    // Limpar interface
    document.getElementById('travelDescription').value = 'Nova Nota de Despesa';
    document.getElementById('valorAdiantamento').value = '0.00';
    this.clearForm();
    
    // Atualizar interface
    this.updateInterface();
  }

  showNotification(message, type = NOTIFICATION_TYPES.INFO) {
    // Remover notificação anterior
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  addResponsiveStyles() {
    if (!document.querySelector('#app-responsive-styles')) {
      const style = document.createElement('style');
      style.id = 'app-responsive-styles';
      style.textContent = `
        @media (max-width: 768px) {
          .app-main {
            padding: var(--spacing-4) var(--spacing-2) !important;
            gap: var(--spacing-6) !important;
          }
          
          .card-body > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          
          .launch-grid {
            gap: var(--spacing-3) !important;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
  }
}

// Instância global da aplicação
const app = new App();

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Exportar para uso global
window.app = app;

export default App;