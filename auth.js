// auth.js - Sistema de Autenticação Segura para ND Express

class AuthManager {
  constructor(supabase) {
    this.supabase = supabase;
    this.currentUser = null;
    this.authListeners = [];

    // Inicializar estado de autenticação
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Verificar se há usuário logado
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      this.currentUser = user;

      // Configurar listener para mudanças de autenticação
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event);

        this.currentUser = session?.user || null;

        // Notificar listeners
        this.authListeners.forEach(callback => {
          try {
            callback(event, session);
          } catch (error) {
            console.error('Erro em auth listener:', error);
          }
        });

        // Redirecionar baseado no estado
        this.handleAuthStateChange(event, session);
      });
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
    }
  }

  handleAuthStateChange(event, session) {
    const currentPath = window.location.pathname;

    if (event === 'SIGNED_IN') {
      // Usuário logou - redirecionar para app se estiver na página de login
      if (currentPath.includes('login.html') || currentPath === '/') {
        window.location.href = 'index.html';
      }
    } else if (event === 'SIGNED_OUT') {
      // Usuário deslogou - redirecionar para login
      if (!currentPath.includes('login.html')) {
        window.location.href = 'login.html';
      }
    }
  }

  // Registrar novo usuário
  async signUp(email, password, userData = {}) {
    try {
      // Validar entrada
      const validation = this.validateCredentials(email, password);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const { data, error } = await this.supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            created_at: new Date().toISOString(),
          },
        },
      });

      if (error) {
        console.error('Erro no registro:', error);
        return { success: false, error: this.getErrorMessage(error) };
      }

      // Log de auditoria
      this.logAuditEvent('user_registered', data.user?.id, {
        email: email.toLowerCase().trim(),
      });

      return {
        success: true,
        user: data.user,
        message: 'Usuário registrado com sucesso! Verifique seu email para confirmar a conta.',
      };
    } catch (error) {
      console.error('Erro inesperado no registro:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  }

  // Login de usuário
  async signIn(email, password) {
    try {
      // Validar entrada
      const validation = this.validateCredentials(email, password);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error('Erro no login:', error);

        // Log de tentativa de login falhada
        this.logAuditEvent('login_failed', null, {
          email: email.toLowerCase().trim(),
          error: error.message,
        });

        return { success: false, error: this.getErrorMessage(error) };
      }

      this.currentUser = data.user;

      // Log de login bem-sucedido
      this.logAuditEvent('login_success', data.user.id, {
        email: data.user.email,
      });

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  }

  // Logout
  async signOut() {
    try {
      const userId = this.currentUser?.id;

      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error('Erro no logout:', error);
        return { success: false, error: 'Erro ao fazer logout' };
      }

      // Log de logout
      this.logAuditEvent('logout', userId);

      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  }

  // Obter usuário atual
  async getCurrentUser() {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        console.error('Erro ao obter usuário:', error);
        return null;
      }

      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Erro inesperado ao obter usuário:', error);
      return null;
    }
  }

  // Verificar se usuário está autenticado
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Adicionar listener para mudanças de autenticação
  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      this.authListeners.push(callback);
    }

    // Retornar função para remover listener
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  // Validar credenciais
  validateCredentials(email, password) {
    const errors = [];

    // Validar email
    if (!email || !email.trim()) {
      errors.push('Email é obrigatório');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Email inválido');
      }
    }

    // Validar senha
    if (!password) {
      errors.push('Senha é obrigatória');
    } else if (password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    return {
      isValid: errors.length === 0,
      error: errors.join(', '),
    };
  }

  // Converter erros do Supabase para mensagens amigáveis
  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
      'User already registered': 'Este email já está registrado',
      'Password should be at least 6 characters': 'Senha deve ter pelo menos 6 caracteres',
      'Unable to validate email address: invalid format': 'Formato de email inválido',
      signup_disabled: 'Registro de novos usuários está desabilitado',
    };

    return errorMessages[error.message] || error.message || 'Erro desconhecido';
  }

  // Log de eventos de auditoria
  async logAuditEvent(action, userId = null, details = {}) {
    try {
      // Obter informações do cliente
      const clientInfo = {
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      // Em um ambiente real, isso seria enviado para um serviço de auditoria
      console.log('📋 Audit Log:', {
        action,
        userId,
        details,
        client: clientInfo,
      });

      // TODO: Implementar envio para sistema de auditoria
      // await this.sendToAuditService({ action, userId, details, client: clientInfo });
    } catch (error) {
      console.error('Erro ao registrar evento de auditoria:', error);
    }
  }

  // Obter IP do cliente (simplificado)
  async getClientIP() {
    try {
      // Em produção, usar serviço adequado para obter IP real
      return 'client-ip-hidden';
    } catch {
      return 'unknown';
    }
  }

  // Resetar senha
  async resetPassword(email) {
    try {
      if (!email || !email.trim()) {
        return { success: false, error: 'Email é obrigatório' };
      }

      const { error } = await this.supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/reset-password.html`,
      });

      if (error) {
        console.error('Erro ao resetar senha:', error);
        return { success: false, error: this.getErrorMessage(error) };
      }

      // Log de reset de senha
      this.logAuditEvent('password_reset_requested', null, {
        email: email.toLowerCase().trim(),
      });

      return {
        success: true,
        message: 'Email de recuperação enviado. Verifique sua caixa de entrada.',
      };
    } catch (error) {
      console.error('Erro inesperado ao resetar senha:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  }

  // Atualizar perfil do usuário
  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { data, error } = await this.supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        return { success: false, error: this.getErrorMessage(error) };
      }

      // Log de atualização de perfil
      this.logAuditEvent('profile_updated', this.currentUser.id, {
        updatedFields: Object.keys(updates),
      });

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Erro inesperado ao atualizar perfil:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  }
}

// Função para proteger páginas que requerem autenticação
function requireAuth() {
  const authManager = window.authManager;

  if (!authManager || !authManager.isAuthenticated()) {
    console.log('🔒 Acesso negado - usuário não autenticado');
    window.location.href = 'login.html';
    return false;
  }

  return true;
}

// Função para redirecionar usuários autenticados da página de login
function redirectIfAuthenticated() {
  const authManager = window.authManager;

  if (authManager && authManager.isAuthenticated()) {
    console.log('✅ Usuário já autenticado - redirecionando');
    window.location.href = 'index.html';
    return true;
  }

  return false;
}

// Inicializar AuthManager globalmente quando o Supabase estiver disponível
if (typeof window !== 'undefined') {
  // Aguardar carregamento do Supabase
  document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
      window.authManager = new AuthManager(window.supabase);
      console.log('🔐 AuthManager inicializado');
    } else {
      console.error('❌ Supabase não encontrado - AuthManager não inicializado');
    }
  });
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthManager, requireAuth, redirectIfAuthenticated };
}
