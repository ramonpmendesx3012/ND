// Componente de botão reutilizável

class Button {
  /**
   * Cria um elemento de botão
   * @param {Object} options - Opções do botão
   * @param {string} options.text - Texto do botão
   * @param {string} options.type - Tipo do botão (primary, secondary, success, error, warning)
   * @param {string} options.size - Tamanho do botão (sm, normal, lg)
   * @param {boolean} options.disabled - Se o botão está desabilitado
   * @param {boolean} options.fullWidth - Se o botão ocupa toda a largura
   * @param {Function} options.onClick - Função executada no clique
   * @param {string} options.icon - Ícone do botão (opcional)
   * @param {string} options.id - ID do elemento
   * @param {string} options.className - Classes CSS adicionais
   * @returns {HTMLButtonElement} Elemento do botão
   */
  static create(options = {}) {
    const {
      text = 'Button',
      type = 'primary',
      size = 'normal',
      disabled = false,
      fullWidth = false,
      onClick = null,
      icon = null,
      id = null,
      className = ''
    } = options;

    // Criar elemento
    const button = document.createElement('button');
    button.type = 'button';
    
    // Aplicar classes CSS
    const classes = ['btn', `btn-${type}`];
    
    if (size !== 'normal') {
      classes.push(`btn-${size}`);
    }
    
    if (fullWidth) {
      classes.push('btn-full');
    }
    
    if (className) {
      classes.push(className);
    }
    
    button.className = classes.join(' ');
    
    // Configurar propriedades
    if (id) {
      button.id = id;
    }
    
    if (disabled) {
      button.disabled = true;
    }
    
    // Adicionar conteúdo
    if (icon && text) {
      button.innerHTML = `${icon} ${text}`;
    } else if (icon) {
      button.innerHTML = icon;
    } else {
      button.textContent = text;
    }
    
    // Adicionar evento de clique
    if (onClick && typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  /**
   * Atualiza o estado de um botão existente
   * @param {HTMLButtonElement} button - Elemento do botão
   * @param {Object} updates - Atualizações a serem aplicadas
   */
  static update(button, updates = {}) {
    if (!button || !(button instanceof HTMLButtonElement)) {
      console.error('Elemento de botão inválido');
      return;
    }

    const { text, disabled, loading } = updates;

    if (text !== undefined) {
      button.textContent = text;
    }

    if (disabled !== undefined) {
      button.disabled = disabled;
    }

    if (loading !== undefined) {
      if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="animate-spin">⟳</span> Carregando...';
      } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Button';
        delete button.dataset.originalText;
      }
    }
  }

  /**
   * Cria um botão de ação primária
   * @param {string} text - Texto do botão
   * @param {Function} onClick - Função de clique
   * @param {Object} options - Opções adicionais
   * @returns {HTMLButtonElement} Elemento do botão
   */
  static primary(text, onClick, options = {}) {
    return this.create({
      text,
      onClick,
      type: 'primary',
      ...options
    });
  }

  /**
   * Cria um botão de ação secundária
   * @param {string} text - Texto do botão
   * @param {Function} onClick - Função de clique
   * @param {Object} options - Opções adicionais
   * @returns {HTMLButtonElement} Elemento do botão
   */
  static secondary(text, onClick, options = {}) {
    return this.create({
      text,
      onClick,
      type: 'secondary',
      ...options
    });
  }

  /**
   * Cria um botão de sucesso
   * @param {string} text - Texto do botão
   * @param {Function} onClick - Função de clique
   * @param {Object} options - Opções adicionais
   * @returns {HTMLButtonElement} Elemento do botão
   */
  static success(text, onClick, options = {}) {
    return this.create({
      text,
      onClick,
      type: 'success',
      ...options
    });
  }

  /**
   * Cria um botão de erro/exclusão
   * @param {string} text - Texto do botão
   * @param {Function} onClick - Função de clique
   * @param {Object} options - Opções adicionais
   * @returns {HTMLButtonElement} Elemento do botão
   */
  static error(text, onClick, options = {}) {
    return this.create({
      text,
      onClick,
      type: 'error',
      ...options
    });
  }

  /**
   * Cria um botão de aviso
   * @param {string} text - Texto do botão
   * @param {Function} onClick - Função de clique
   * @param {Object} options - Opções adicionais
   * @returns {HTMLButtonElement} Elemento do botão
   */
  static warning(text, onClick, options = {}) {
    return this.create({
      text,
      onClick,
      type: 'warning',
      ...options
    });
  }

  /**
   * Cria um grupo de botões
   * @param {Array} buttons - Array de configurações de botões
   * @param {Object} options - Opções do grupo
   * @returns {HTMLDivElement} Container com os botões
   */
  static group(buttons = [], options = {}) {
    const { className = '', gap = 'var(--spacing-3)' } = options;
    
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = gap;
    
    if (className) {
      container.className = className;
    }
    
    buttons.forEach(buttonConfig => {
      const button = this.create(buttonConfig);
      container.appendChild(button);
    });
    
    return container;
  }
}

export default Button;