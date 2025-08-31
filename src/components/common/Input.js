// Componente de input reutilizável

class Input {
  /**
   * Cria um elemento de input com label e validação
   * @param {Object} options - Opções do input
   * @param {string} options.type - Tipo do input (text, email, password, number, date, etc.)
   * @param {string} options.label - Label do input
   * @param {string} options.placeholder - Placeholder do input
   * @param {string} options.value - Valor inicial
   * @param {boolean} options.required - Se o campo é obrigatório
   * @param {boolean} options.disabled - Se o campo está desabilitado
   * @param {string} options.id - ID do elemento
   * @param {string} options.name - Nome do campo
   * @param {string} options.className - Classes CSS adicionais
   * @param {string} options.help - Texto de ajuda
   * @param {Function} options.onChange - Função executada na mudança
   * @param {Function} options.onBlur - Função executada ao perder foco
   * @param {Object} options.validation - Regras de validação
   * @returns {HTMLDivElement} Container com o input completo
   */
  static create(options = {}) {
    const {
      type = 'text',
      label = '',
      placeholder = '',
      value = '',
      required = false,
      disabled = false,
      id = null,
      name = null,
      className = '',
      help = '',
      onChange = null,
      onBlur = null,
      validation = {}
    } = options;

    // Criar container
    const container = document.createElement('div');
    container.className = 'form-group';

    // Criar label se fornecido
    if (label) {
      const labelElement = document.createElement('label');
      labelElement.className = 'form-label';
      labelElement.textContent = label + (required ? ' *' : '');
      
      if (id) {
        labelElement.setAttribute('for', id);
      }
      
      container.appendChild(labelElement);
    }

    // Criar input
    const input = document.createElement('input');
    input.type = type;
    input.className = `input ${className}`.trim();
    
    if (id) input.id = id;
    if (name) input.name = name;
    if (placeholder) input.placeholder = placeholder;
    if (value) input.value = value;
    if (required) input.required = true;
    if (disabled) input.disabled = true;

    // Aplicar validações HTML5
    if (validation.min !== undefined) input.min = validation.min;
    if (validation.max !== undefined) input.max = validation.max;
    if (validation.minLength !== undefined) input.minLength = validation.minLength;
    if (validation.maxLength !== undefined) input.maxLength = validation.maxLength;
    if (validation.pattern) input.pattern = validation.pattern;
    if (validation.step !== undefined) input.step = validation.step;

    container.appendChild(input);

    // Criar texto de ajuda se fornecido
    if (help) {
      const helpElement = document.createElement('div');
      helpElement.className = 'form-help';
      helpElement.textContent = help;
      container.appendChild(helpElement);
    }

    // Criar container para mensagens de erro
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.style.display = 'none';
    container.appendChild(errorElement);

    // Adicionar eventos
    if (onChange && typeof onChange === 'function') {
      input.addEventListener('input', (e) => onChange(e.target.value, e));
    }

    if (onBlur && typeof onBlur === 'function') {
      input.addEventListener('blur', (e) => onBlur(e.target.value, e));
    }

    // Adicionar validação em tempo real
    input.addEventListener('blur', () => {
      this.validate(container, validation);
    });

    input.addEventListener('input', () => {
      this.clearError(container);
    });

    return container;
  }

  /**
   * Cria um input de texto
   * @param {string} label - Label do input
   * @param {Object} options - Opções adicionais
   * @returns {HTMLDivElement} Container do input
   */
  static text(label, options = {}) {
    return this.create({
      type: 'text',
      label,
      ...options
    });
  }

  /**
   * Cria um input de email
   * @param {string} label - Label do input
   * @param {Object} options - Opções adicionais
   * @returns {HTMLDivElement} Container do input
   */
  static email(label, options = {}) {
    return this.create({
      type: 'email',
      label,
      ...options
    });
  }

  /**
   * Cria um input de senha
   * @param {string} label - Label do input
   * @param {Object} options - Opções adicionais
   * @returns {HTMLDivElement} Container do input
   */
  static password(label, options = {}) {
    return this.create({
      type: 'password',
      label,
      ...options
    });
  }

  /**
   * Cria um input numérico
   * @param {string} label - Label do input
   * @param {Object} options - Opções adicionais
   * @returns {HTMLDivElement} Container do input
   */
  static number(label, options = {}) {
    return this.create({
      type: 'number',
      label,
      ...options
    });
  }

  /**
   * Cria um input de data
   * @param {string} label - Label do input
   * @param {Object} options - Opções adicionais
   * @returns {HTMLDivElement} Container do input
   */
  static date(label, options = {}) {
    return this.create({
      type: 'date',
      label,
      ...options
    });
  }

  /**
   * Cria um select
   * @param {string} label - Label do select
   * @param {Array} options - Opções do select
   * @param {Object} config - Configurações adicionais
   * @returns {HTMLDivElement} Container do select
   */
  static select(label, options = [], config = {}) {
    const {
      value = '',
      required = false,
      disabled = false,
      id = null,
      name = null,
      className = '',
      help = '',
      onChange = null
    } = config;

    // Criar container
    const container = document.createElement('div');
    container.className = 'form-group';

    // Criar label
    if (label) {
      const labelElement = document.createElement('label');
      labelElement.className = 'form-label';
      labelElement.textContent = label + (required ? ' *' : '');
      
      if (id) {
        labelElement.setAttribute('for', id);
      }
      
      container.appendChild(labelElement);
    }

    // Criar select
    const select = document.createElement('select');
    select.className = `input ${className}`.trim();
    
    if (id) select.id = id;
    if (name) select.name = name;
    if (required) select.required = true;
    if (disabled) select.disabled = true;

    // Adicionar opções
    options.forEach(option => {
      const optionElement = document.createElement('option');
      
      if (typeof option === 'string') {
        optionElement.value = option;
        optionElement.textContent = option;
      } else {
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        if (option.disabled) optionElement.disabled = true;
      }
      
      if (optionElement.value === value) {
        optionElement.selected = true;
      }
      
      select.appendChild(optionElement);
    });

    container.appendChild(select);

    // Criar texto de ajuda
    if (help) {
      const helpElement = document.createElement('div');
      helpElement.className = 'form-help';
      helpElement.textContent = help;
      container.appendChild(helpElement);
    }

    // Adicionar evento de mudança
    if (onChange && typeof onChange === 'function') {
      select.addEventListener('change', (e) => onChange(e.target.value, e));
    }

    return container;
  }

  /**
   * Valida um input
   * @param {HTMLDivElement} container - Container do input
   * @param {Object} validation - Regras de validação
   * @returns {boolean} Se a validação passou
   */
  static validate(container, validation = {}) {
    const input = container.querySelector('input, select');
    const errorElement = container.querySelector('.form-error');
    
    if (!input || !errorElement) return true;

    const value = input.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Validação de campo obrigatório
    if (input.required && !value) {
      isValid = false;
      errorMessage = 'Este campo é obrigatório';
    }
    // Validação customizada
    else if (validation.custom && typeof validation.custom === 'function') {
      const customResult = validation.custom(value);
      if (customResult !== true) {
        isValid = false;
        errorMessage = customResult || 'Valor inválido';
      }
    }
    // Validação HTML5
    else if (!input.checkValidity()) {
      isValid = false;
      errorMessage = input.validationMessage;
    }

    // Mostrar/ocultar erro
    if (isValid) {
      this.clearError(container);
    } else {
      this.showError(container, errorMessage);
    }

    return isValid;
  }

  /**
   * Mostra erro em um input
   * @param {HTMLDivElement} container - Container do input
   * @param {string} message - Mensagem de erro
   */
  static showError(container, message) {
    const input = container.querySelector('input, select');
    const errorElement = container.querySelector('.form-error');
    
    if (input) {
      input.classList.add('error');
    }
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Limpa erro de um input
   * @param {HTMLDivElement} container - Container do input
   */
  static clearError(container) {
    const input = container.querySelector('input, select');
    const errorElement = container.querySelector('.form-error');
    
    if (input) {
      input.classList.remove('error');
    }
    
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }
  }

  /**
   * Obtém o valor de um input
   * @param {HTMLDivElement} container - Container do input
   * @returns {string} Valor do input
   */
  static getValue(container) {
    const input = container.querySelector('input, select');
    return input ? input.value : '';
  }

  /**
   * Define o valor de um input
   * @param {HTMLDivElement} container - Container do input
   * @param {string} value - Novo valor
   */
  static setValue(container, value) {
    const input = container.querySelector('input, select');
    if (input) {
      input.value = value;
    }
  }
}

export default Input;