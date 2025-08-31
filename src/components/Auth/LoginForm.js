// Componente de formulário de login
// Interface moderna e responsiva para autenticação

import { authService } from '../../services/authService.js';
import { showLoading, hideLoading } from '../LoadingOverlay/LoadingOverlay.js';

class LoginForm {
  constructor() {
    this.isLoginMode = true; // true = login, false = registro
    this.element = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'auth-container';
    this.element.innerHTML = this.getHTML();
    this.bindEvents();
    return this.element;
  }

  getHTML() {
    return `
      <div class="auth-overlay">
        <div class="auth-modal">
          <div class="auth-header">
            <h2 class="auth-title">
              ${this.isLoginMode ? '🔐 Entrar no Sistema' : '👤 Criar Conta'}
            </h2>
            <p class="auth-subtitle">
              ${this.isLoginMode 
                ? 'Acesse sua conta do ND Express' 
                : 'Registre-se no ND Express'}
            </p>
          </div>

          <form class="auth-form" id="authForm">
            ${!this.isLoginMode ? `
              <div class="form-group">
                <label for="nome">Nome Completo</label>
                <input 
                  type="text" 
                  id="nome" 
                  name="nome" 
                  required 
                  placeholder="Digite seu nome completo"
                  autocomplete="name"
                >
                <span class="form-error" id="nomeError"></span>
              </div>
            ` : ''}

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                placeholder="Digite seu email"
                autocomplete="email"
              >
              <span class="form-error" id="emailError"></span>
            </div>

            ${!this.isLoginMode ? `
              <div class="form-group">
                <label for="cpf">CPF</label>
                <input 
                  type="text" 
                  id="cpf" 
                  name="cpf" 
                  required 
                  placeholder="000.000.000-00"
                  maxlength="14"
                >
                <span class="form-error" id="cpfError"></span>
              </div>
            ` : ''}

            <div class="form-group">
              <label for="senha">Senha</label>
              <div class="password-input">
                <input 
                  type="password" 
                  id="senha" 
                  name="senha" 
                  required 
                  placeholder="${this.isLoginMode ? 'Digite sua senha' : 'Mínimo 6 caracteres'}"
                  autocomplete="${this.isLoginMode ? 'current-password' : 'new-password'}"
                >
                <button type="button" class="password-toggle" id="passwordToggle">
                  👁️
                </button>
              </div>
              <span class="form-error" id="senhaError"></span>
            </div>

            <button type="submit" class="auth-submit" id="authSubmit">
              ${this.isLoginMode ? '🔓 Entrar' : '✅ Criar Conta'}
            </button>
          </form>

          <div class="auth-footer">
            <p class="auth-switch">
              ${this.isLoginMode 
                ? 'Não tem uma conta?' 
                : 'Já tem uma conta?'}
              <button type="button" class="auth-switch-btn" id="authSwitchBtn">
                ${this.isLoginMode ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>

          <div class="auth-info">
            <p class="info-text">
              ${this.isLoginMode 
                ? '💡 Sua conta precisa estar ativa para acessar o sistema' 
                : '⚠️ Sua conta será criada como inativa e precisa ser ativada pelo administrador'}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    if (!this.element) return;

    // Formulário de autenticação
    const form = this.element.querySelector('#authForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Alternar entre login e registro
    const switchBtn = this.element.querySelector('#authSwitchBtn');
    switchBtn.addEventListener('click', () => this.toggleMode());

    // Toggle de senha
    const passwordToggle = this.element.querySelector('#passwordToggle');
    passwordToggle.addEventListener('click', () => this.togglePassword());

    // Máscara de CPF (apenas no modo registro)
    if (!this.isLoginMode) {
      const cpfInput = this.element.querySelector('#cpf');
      if (cpfInput) {
        cpfInput.addEventListener('input', (e) => this.formatCPF(e));
      }
    }

    // Validação em tempo real
    const inputs = this.element.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearError(input));
    });
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validar formulário
    if (!this.validateForm(data)) {
      return;
    }

    try {
      showLoading(this.isLoginMode ? 'Fazendo login...' : 'Criando conta...');
      
      if (this.isLoginMode) {
        await this.handleLogin(data);
      } else {
        await this.handleRegister(data);
      }
    } catch (error) {
      this.showError('geral', error.message);
    } finally {
      hideLoading();
    }
  }

  async handleLogin(data) {
    try {
      await authService.login(data.email, data.senha);
      
      // Sucesso - fechar modal e recarregar app
      this.showSuccess('Login realizado com sucesso!');
      setTimeout(() => {
        this.close();
        window.location.reload(); // Recarregar para aplicar autenticação
      }, 1500);
    } catch (error) {
      if (error.message.includes('inativo')) {
        this.showError('geral', 'Sua conta ainda não foi ativada pelo administrador.');
      } else if (error.message.includes('bloqueado')) {
        this.showError('geral', error.message);
      } else {
        this.showError('geral', 'Email ou senha incorretos.');
      }
    }
  }

  async handleRegister(data) {
    try {
      await authService.register({
        nome: data.nome,
        email: data.email,
        cpf: data.cpf,
        senha: data.senha
      });
      
      this.showSuccess('Conta criada com sucesso! Aguarde a ativação pelo administrador.');
      setTimeout(() => {
        this.toggleMode(); // Voltar para modo login
      }, 2000);
    } catch (error) {
      if (error.message.includes('email')) {
        this.showError('email', 'Este email já está em uso.');
      } else if (error.message.includes('CPF')) {
        this.showError('cpf', 'Este CPF já está em uso.');
      } else {
        this.showError('geral', error.message);
      }
    }
  }

  validateForm(data) {
    let isValid = true;

    // Validar email
    if (!authService.validateEmail(data.email)) {
      this.showError('email', 'Email inválido.');
      isValid = false;
    }

    // Validar senha
    if (data.senha.length < 6) {
      this.showError('senha', 'Senha deve ter pelo menos 6 caracteres.');
      isValid = false;
    }

    // Validações específicas do registro
    if (!this.isLoginMode) {
      if (!data.nome || data.nome.trim().length < 2) {
        this.showError('nome', 'Nome deve ter pelo menos 2 caracteres.');
        isValid = false;
      }

      if (!authService.validateCPF(data.cpf)) {
        this.showError('cpf', 'CPF inválido.');
        isValid = false;
      }
    }

    return isValid;
  }

  validateField(input) {
    const value = input.value.trim();
    const name = input.name;

    switch (name) {
      case 'email':
        if (value && !authService.validateEmail(value)) {
          this.showError('email', 'Email inválido.');
        }
        break;
      case 'cpf':
        if (value && !authService.validateCPF(value)) {
          this.showError('cpf', 'CPF inválido.');
        }
        break;
      case 'senha':
        if (value && value.length < 6) {
          this.showError('senha', 'Senha deve ter pelo menos 6 caracteres.');
        }
        break;
    }
  }

  formatCPF(event) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    event.target.value = value;
  }

  togglePassword() {
    const passwordInput = this.element.querySelector('#senha');
    const toggleBtn = this.element.querySelector('#passwordToggle');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = '👁️';
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.element.innerHTML = this.getHTML();
    this.bindEvents();
  }

  showError(field, message) {
    const errorElement = this.element.querySelector(`#${field}Error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    } else {
      // Erro geral
      this.showNotification(message, 'error');
    }
  }

  clearError(input) {
    const errorElement = this.element.querySelector(`#${input.name}Error`);
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type) {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.textContent = message;
    
    this.element.querySelector('.auth-modal').appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  close() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

export default LoginForm;