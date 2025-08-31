// Componente de overlay de carregamento

class LoadingOverlay {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
  }

  /**
   * Cria o elemento de overlay
   * @returns {HTMLDivElement} Elemento do overlay
   */
  createElement() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.display = 'none';
    
    const content = document.createElement('div');
    content.className = 'loading-content';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const text = document.createElement('p');
    text.textContent = 'Carregando...';
    text.style.marginTop = 'var(--spacing-4)';
    text.style.marginBottom = '0';
    text.style.color = 'var(--gray-600)';
    
    content.appendChild(spinner);
    content.appendChild(text);
    overlay.appendChild(content);
    
    return overlay;
  }

  /**
   * Inicializa o overlay no DOM
   */
  init() {
    if (!this.overlay) {
      this.overlay = this.createElement();
      document.body.appendChild(this.overlay);
    }
  }

  /**
   * Mostra o overlay de carregamento
   * @param {string} message - Mensagem personalizada (opcional)
   */
  show(message = 'Carregando...') {
    this.init();
    
    const textElement = this.overlay.querySelector('p');
    if (textElement) {
      textElement.textContent = message;
    }
    
    this.overlay.style.display = 'flex';
    this.isVisible = true;
    
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';
  }

  /**
   * Oculta o overlay de carregamento
   */
  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.isVisible = false;
      
      // Restaurar scroll do body
      document.body.style.overflow = '';
    }
  }

  /**
   * Alterna a visibilidade do overlay
   * @param {boolean} show - Se deve mostrar ou ocultar
   * @param {string} message - Mensagem personalizada
   */
  toggle(show, message) {
    if (show) {
      this.show(message);
    } else {
      this.hide();
    }
  }

  /**
   * Verifica se o overlay está visível
   * @returns {boolean} Se está visível
   */
  isShowing() {
    return this.isVisible;
  }

  /**
   * Remove o overlay do DOM
   */
  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
      this.overlay = null;
      this.isVisible = false;
      document.body.style.overflow = '';
    }
  }

  /**
   * Mostra overlay com progresso
   * @param {number} progress - Progresso de 0 a 100
   * @param {string} message - Mensagem
   */
  showWithProgress(progress = 0, message = 'Carregando...') {
    this.init();
    
    // Atualizar conteúdo para incluir barra de progresso
    const content = this.overlay.querySelector('.loading-content');
    
    let progressBar = content.querySelector('.progress-bar');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressBar.style.cssText = `
        width: 200px;
        height: 4px;
        background-color: var(--gray-200);
        border-radius: var(--border-radius);
        overflow: hidden;
        margin-top: var(--spacing-4);
      `;
      
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.cssText = `
        height: 100%;
        background-color: var(--primary-color);
        transition: width var(--transition-normal);
        width: 0%;
      `;
      
      progressBar.appendChild(progressFill);
      content.appendChild(progressBar);
    }
    
    // Atualizar progresso
    const progressFill = progressBar.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    
    // Atualizar mensagem
    const textElement = content.querySelector('p');
    if (textElement) {
      textElement.textContent = `${message} (${Math.round(progress)}%)`;
    }
    
    this.overlay.style.display = 'flex';
    this.isVisible = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cria um overlay temporário que se auto-remove
   * @param {string} message - Mensagem
   * @param {number} duration - Duração em ms
   * @returns {Promise} Promise que resolve quando o overlay é removido
   */
  static showTemporary(message = 'Carregando...', duration = 2000) {
    return new Promise((resolve) => {
      const overlay = new LoadingOverlay();
      overlay.show(message);
      
      setTimeout(() => {
        overlay.hide();
        overlay.destroy();
        resolve();
      }, duration);
    });
  }

  /**
   * Cria um overlay para uma operação assíncrona
   * @param {Function} asyncOperation - Função assíncrona
   * @param {string} message - Mensagem de carregamento
   * @returns {Promise} Promise da operação
   */
  static async withOperation(asyncOperation, message = 'Carregando...') {
    const overlay = new LoadingOverlay();
    
    try {
      overlay.show(message);
      const result = await asyncOperation();
      return result;
    } finally {
      overlay.hide();
      overlay.destroy();
    }
  }
}

// Instância global para uso simples
const globalLoadingOverlay = new LoadingOverlay();

// Funções de conveniência
export function showLoading(message) {
  globalLoadingOverlay.show(message);
}

export function hideLoading() {
  globalLoadingOverlay.hide();
}

export function toggleLoading(show, message) {
  globalLoadingOverlay.toggle(show, message);
}

export function showLoadingWithProgress(progress, message) {
  globalLoadingOverlay.showWithProgress(progress, message);
}

export default LoadingOverlay;