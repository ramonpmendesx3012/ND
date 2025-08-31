// Serviço de autenticação
// Gerencia login, logout, registro e verificação de token

import { request } from '../config/apiClient.js';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('nd_token');
    this.user = JSON.parse(localStorage.getItem('nd_user') || 'null');
    this.isAuthenticated = !!this.token;
  }

  /**
   * Registrar novo usuário
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.nome - Nome completo
   * @param {string} userData.email - Email
   * @param {string} userData.cpf - CPF
   * @param {string} userData.senha - Senha
   * @returns {Promise<Object>} Resultado do registro
   */
  async register(userData) {
    try {
      const response = await request('/auth/register', {
        method: 'POST',
        body: userData
      });

      if (response.success) {
        console.log('✅ Usuário registrado com sucesso');
        return response;
      } else {
        throw new Error(response.message || 'Erro no registro');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  /**
   * Fazer login
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Promise<Object>} Dados do usuário e token
   */
  async login(email, senha) {
    try {
      const response = await request('/auth/login', {
        method: 'POST',
        body: { email, senha }
      });

      if (response.success) {
        // Armazenar token e dados do usuário
        this.token = response.data.token;
        this.user = response.data.usuario;
        this.isAuthenticated = true;

        localStorage.setItem('nd_token', this.token);
        localStorage.setItem('nd_user', JSON.stringify(this.user));

        console.log('✅ Login realizado com sucesso');
        return response.data;
      } else {
        throw new Error(response.message || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * Fazer logout
   * @returns {Promise<boolean>} Sucesso do logout
   */
  async logout() {
    try {
      if (this.token) {
        // Tentar invalidar token no servidor
        await request('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
    } catch (error) {
      console.warn('Erro ao invalidar token no servidor:', error);
    } finally {
      // Limpar dados locais independentemente do resultado
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;

      localStorage.removeItem('nd_token');
      localStorage.removeItem('nd_user');

      console.log('✅ Logout realizado');
    }

    return true;
  }

  /**
   * Verificar se token é válido
   * @returns {Promise<boolean>} Token válido
   */
  async verifyToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await request('/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.success) {
        // Atualizar dados do usuário se necessário
        this.user = response.data.usuario;
        localStorage.setItem('nd_user', JSON.stringify(this.user));
        return true;
      } else {
        // Token inválido - fazer logout
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      // Em caso de erro, fazer logout por segurança
      await this.logout();
      return false;
    }
  }

  /**
   * Obter token atual
   * @returns {string|null} Token JWT
   */
  getToken() {
    return this.token;
  }

  /**
   * Obter dados do usuário atual
   * @returns {Object|null} Dados do usuário
   */
  getUser() {
    return this.user;
  }

  /**
   * Verificar se usuário está autenticado
   * @returns {boolean} Está autenticado
   */
  isLoggedIn() {
    return this.isAuthenticated && !!this.token;
  }

  /**
   * Obter header de autorização
   * @returns {Object} Headers com Authorization
   */
  getAuthHeaders() {
    if (!this.token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * Verificar se token está próximo do vencimento
   * @returns {boolean} Token expira em menos de 1 hora
   */
  isTokenExpiringSoon() {
    if (!this.token) {
      return true;
    }

    try {
      // Decodificar payload do JWT (sem verificar assinatura)
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Converter para milliseconds
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hora em milliseconds

      return (expirationTime - currentTime) < oneHour;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return true;
    }
  }

  /**
   * Inicializar verificação automática de token
   * Verifica token a cada 5 minutos
   */
  startTokenVerification() {
    // Verificar imediatamente
    this.verifyToken();

    // Verificar a cada 5 minutos
    setInterval(() => {
      if (this.isLoggedIn()) {
        this.verifyToken();
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Validar formato de email
   * @param {string} email - Email para validar
   * @returns {boolean} Email válido
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar CPF
   * @param {string} cpf - CPF para validar
   * @returns {boolean} CPF válido
   */
  validateCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      return false;
    }

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) {
      return false;
    }

    // Calcular dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digito1 = resto < 2 ? 0 : resto;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digito2 = resto < 2 ? 0 : resto;

    return digito1 === parseInt(cpfLimpo.charAt(9)) && 
           digito2 === parseInt(cpfLimpo.charAt(10));
  }

  /**
   * Formatar CPF
   * @param {string} cpf - CPF para formatar
   * @returns {string} CPF formatado
   */
  formatCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}

// Instância singleton
export const authService = new AuthService();
export default authService;