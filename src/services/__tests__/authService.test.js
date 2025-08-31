// Testes para authService
import { authService } from '../authService.js';

// Mock do apiClient
jest.mock('../../config/apiClient.js', () => ({
  request: jest.fn()
}));

import { request } from '../../config/apiClient.js';

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset authService state
    authService.token = null;
    authService.user = null;
    authService.isAuthenticated = false;
  });

  describe('register', () => {
    test('registra usuário com sucesso', async () => {
      const userData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        cpf: '123.456.789-00',
        senha: 'senha123'
      };

      const mockResponse = {
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          id: 'user-123',
          nome: userData.nome,
          email: userData.email,
          ativo: false
        }
      };

      request.mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(request).toHaveBeenCalledWith('/auth/register', {
        method: 'POST',
        body: userData
      });
      expect(result).toEqual(mockResponse);
    });

    test('lança erro quando registro falha', async () => {
      const userData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        cpf: '123.456.789-00',
        senha: 'senha123'
      };

      request.mockRejectedValue(new Error('Email já existe'));

      await expect(authService.register(userData))
        .rejects.toThrow('Email já existe');
    });
  });

  describe('login', () => {
    test('faz login com sucesso', async () => {
      const credentials = {
        email: 'joao@teste.com',
        senha: 'senha123'
      };

      const mockResponse = {
        success: true,
        data: {
          token: 'jwt-token-123',
          usuario: {
            id: 'user-123',
            nome: 'João Silva',
            email: 'joao@teste.com'
          }
        }
      };

      request.mockResolvedValue(mockResponse);

      const result = await authService.login(credentials.email, credentials.senha);

      expect(request).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: credentials
      });
      
      expect(authService.token).toBe('jwt-token-123');
      expect(authService.user).toEqual(mockResponse.data.usuario);
      expect(authService.isAuthenticated).toBe(true);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('nd_token', 'jwt-token-123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('nd_user', JSON.stringify(mockResponse.data.usuario));
      
      expect(result).toEqual(mockResponse.data);
    });

    test('lança erro quando login falha', async () => {
      request.mockRejectedValue(new Error('Credenciais inválidas'));

      await expect(authService.login('email@teste.com', 'senhaerrada'))
        .rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('logout', () => {
    test('faz logout com sucesso', async () => {
      // Setup: usuário logado
      authService.token = 'jwt-token-123';
      authService.user = { id: 'user-123', nome: 'João' };
      authService.isAuthenticated = true;

      const mockResponse = {
        success: true,
        message: 'Logout realizado com sucesso'
      };

      request.mockResolvedValue(mockResponse);

      const result = await authService.logout();

      expect(request).toHaveBeenCalledWith('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer jwt-token-123'
        }
      });
      
      expect(authService.token).toBe(null);
      expect(authService.user).toBe(null);
      expect(authService.isAuthenticated).toBe(false);
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nd_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nd_user');
      
      expect(result).toBe(true);
    });

    test('faz logout mesmo quando API falha', async () => {
      authService.token = 'jwt-token-123';
      
      request.mockRejectedValue(new Error('Erro de rede'));

      const result = await authService.logout();

      // Deve limpar dados locais mesmo com erro na API
      expect(authService.token).toBe(null);
      expect(authService.user).toBe(null);
      expect(authService.isAuthenticated).toBe(false);
      expect(result).toBe(true);
    });
  });

  describe('verifyToken', () => {
    test('verifica token válido', async () => {
      authService.token = 'jwt-token-123';
      
      const mockResponse = {
        success: true,
        data: {
          usuario: {
            id: 'user-123',
            nome: 'João Silva',
            email: 'joao@teste.com'
          }
        }
      };

      request.mockResolvedValue(mockResponse);

      const result = await authService.verifyToken();

      expect(request).toHaveBeenCalledWith('/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer jwt-token-123'
        }
      });
      
      expect(authService.user).toEqual(mockResponse.data.usuario);
      expect(result).toBe(true);
    });

    test('retorna false para token inválido', async () => {
      authService.token = 'invalid-token';
      
      request.mockRejectedValue(new Error('Token inválido'));

      const result = await authService.verifyToken();

      expect(result).toBe(false);
      expect(authService.token).toBe(null);
      expect(authService.user).toBe(null);
      expect(authService.isAuthenticated).toBe(false);
    });

    test('retorna false quando não há token', async () => {
      authService.token = null;

      const result = await authService.verifyToken();

      expect(result).toBe(false);
      expect(request).not.toHaveBeenCalled();
    });
  });

  describe('getToken', () => {
    test('retorna token atual', () => {
      authService.token = 'jwt-token-123';
      expect(authService.getToken()).toBe('jwt-token-123');
    });

    test('retorna null quando não há token', () => {
      authService.token = null;
      expect(authService.getToken()).toBe(null);
    });
  });

  describe('getUser', () => {
    test('retorna dados do usuário', () => {
      const user = { id: 'user-123', nome: 'João' };
      authService.user = user;
      expect(authService.getUser()).toEqual(user);
    });

    test('retorna null quando não há usuário', () => {
      authService.user = null;
      expect(authService.getUser()).toBe(null);
    });
  });

  describe('isLoggedIn', () => {
    test('retorna true quando usuário está logado', () => {
      authService.isAuthenticated = true;
      authService.token = 'jwt-token-123';
      expect(authService.isLoggedIn()).toBe(true);
    });

    test('retorna false quando usuário não está logado', () => {
      authService.isAuthenticated = false;
      authService.token = null;
      expect(authService.isLoggedIn()).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    test('retorna headers com Authorization', () => {
      authService.token = 'jwt-token-123';
      
      const headers = authService.getAuthHeaders();
      
      expect(headers).toEqual({
        'Authorization': 'Bearer jwt-token-123'
      });
    });

    test('retorna objeto vazio quando não há token', () => {
      authService.token = null;
      
      const headers = authService.getAuthHeaders();
      
      expect(headers).toEqual({});
    });
  });

  describe('validateEmail', () => {
    test('valida emails corretos', () => {
      expect(authService.validateEmail('teste@exemplo.com')).toBe(true);
      expect(authService.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(authService.validateEmail('test+tag@gmail.com')).toBe(true);
    });

    test('rejeita emails inválidos', () => {
      expect(authService.validateEmail('email-invalido')).toBe(false);
      expect(authService.validateEmail('teste@')).toBe(false);
      expect(authService.validateEmail('@exemplo.com')).toBe(false);
      expect(authService.validateEmail('')).toBe(false);
    });
  });

  describe('validateCPF', () => {
    test('valida CPFs corretos', () => {
      expect(authService.validateCPF('123.456.789-09')).toBe(true);
      expect(authService.validateCPF('12345678909')).toBe(true);
    });

    test('rejeita CPFs inválidos', () => {
      expect(authService.validateCPF('123.456.789-00')).toBe(false); // Dígitos inválidos
      expect(authService.validateCPF('111.111.111-11')).toBe(false); // Todos iguais
      expect(authService.validateCPF('123.456.789')).toBe(false); // Muito curto
      expect(authService.validateCPF('')).toBe(false);
    });
  });

  describe('formatCPF', () => {
    test('formata CPF corretamente', () => {
      expect(authService.formatCPF('12345678909')).toBe('123.456.789-09');
      expect(authService.formatCPF('123.456.789-09')).toBe('123.456.789-09');
    });

    test('lida com CPF parcial', () => {
      expect(authService.formatCPF('123456')).toBe('123.456');
      expect(authService.formatCPF('123456789')).toBe('123.456.789');
    });
  });

  describe('isTokenExpiringSoon', () => {
    test('retorna true quando não há token', () => {
      authService.token = null;
      expect(authService.isTokenExpiringSoon()).toBe(true);
    });

    test('detecta token próximo do vencimento', () => {
      // Criar token que expira em 30 minutos
      const payload = {
        exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutos
      };
      const fakeToken = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      authService.token = fakeToken;
      
      expect(authService.isTokenExpiringSoon()).toBe(true);
    });

    test('detecta token com tempo suficiente', () => {
      // Criar token que expira em 2 horas
      const payload = {
        exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 horas
      };
      const fakeToken = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      authService.token = fakeToken;
      
      expect(authService.isTokenExpiringSoon()).toBe(false);
    });
  });
});