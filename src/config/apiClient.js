// Configuração do cliente para APIs backend
// Centraliza todas as chamadas para os endpoints seguros

class ApiClient {
  constructor() {
    this.baseURL = '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
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