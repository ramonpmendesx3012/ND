// Configuração do cliente para APIs backend
// Centraliza todas as chamadas para os endpoints seguros

// Import de authService removido

class ApiClient {
  constructor() {
    this.baseURL = '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Preparar headers sem autenticação
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const config = {
      method: 'POST',
      headers,
      ...options
    };

    // Serializar body para JSON se for um objeto
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
    
    try {
      console.log(`📡 ${config.method} ${url}`);
      
      const response = await fetch(url, config);
      
      // Tratamento de erros sem autenticação
      // Erros 401/403 removidos pois não há mais autenticação
      
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
      
      // Se erro de rede, pode ser problema de conectividade
      if (error.message.includes('Failed to fetch')) {
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