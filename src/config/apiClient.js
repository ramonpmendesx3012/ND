// Configuração do cliente para APIs backend
// Centraliza todas as chamadas para os endpoints seguros

import { authService } from '../services/authService.js';

class ApiClient {
  constructor() {
    this.baseURL = '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Preparar headers com autenticação
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Adicionar token de autenticação se disponível (exceto para rotas de auth)
    const token = authService.getToken();
    if (token && !endpoint.startsWith('/auth/')) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      method: 'POST',
      headers,
      ...options
    };
    
    try {
      console.log(`📡 ${config.method} ${url}`);
      
      const response = await fetch(url, config);
      
      // Tratar erros de autenticação
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        
        // Se token expirou ou é inválido, fazer logout
        if (errorData.error?.includes('Token') || errorData.error?.includes('inativo')) {
          console.warn('🔒 Token inválido ou usuário inativo - fazendo logout');
          await authService.logout();
          window.location.reload();
          return;
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro de rede',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new Error(errorData.message || errorData.error || 'Erro na requisição');
      }
      
      const data = await response.json();
      console.log(`✅ Resposta recebida de ${endpoint}`);
      
      return data;
    } catch (error) {
      console.error(`❌ Erro na requisição para ${endpoint}:`, error);
      
      // Se erro de rede e usuário está logado, pode ser problema de conectividade
      if (error.message.includes('Failed to fetch') && authService.isLoggedIn()) {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }
      
      throw error;
    }
  }

  // Métodos específicos para cada endpoint
  async query(table, options = {}) {
    return this.request('/supabase-query', {
      body: JSON.stringify({ table, ...options })
    });
  }

  async insert(table, data, select = '*') {
    return this.request('/supabase-insert', {
      body: JSON.stringify({ table, data, select })
    });
  }

  async update(table, data, filters, select = '*') {
    return this.request('/supabase-update', {
      body: JSON.stringify({ table, data, filters, select })
    });
  }

  async delete(table, filters, select) {
    return this.request('/supabase-delete', {
      body: JSON.stringify({ table, filters, select })
    });
  }

  async upload(fileBase64, fileName) {
    return this.request('/supabase-upload', {
      body: JSON.stringify({ fileBase64, fileName })
    });
  }

  async analyzeImage(imageBase64, prompt) {
    return this.request('/openai-analyze', {
      body: JSON.stringify({ imageBase64, prompt })
    });
  }
}

// Exportar instância única (singleton)
export const apiClient = new ApiClient();
export default apiClient;