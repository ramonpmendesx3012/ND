// Rotas da API - ND Express
// Centraliza todas as rotas das APIs backend

const express = require('express');
const router = express.Router();
const path = require('path');

// Importar middleware de segurança
const { authenticateToken, rateLimit, validateApiKey } = require('./middleware/auth');

// Importar handlers das APIs
const openaiAnalyze = require('./openai-analyze');
const supabaseQuery = require('./supabase-query');
const supabaseInsert = require('./supabase-insert');
const supabaseUpdate = require('./supabase-update');
const supabaseDelete = require('./supabase-delete');
const supabaseUpload = require('./supabase-upload');

// Importar handlers de autenticação
const authRegister = require('./auth-register');
const authLogin = require('./auth-login');
const authVerify = require('./auth-verify');
const authLogout = require('./auth-logout');

// Middleware de log para debug
router.use((req, res, next) => {
  console.log(`📡 API ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rotas da API com segurança

// === ROTAS DE AUTENTICAÇÃO ===
// Registro de usuário - Rate limiting moderado
router.post('/auth/register', 
  rateLimit(5, 60000), // 5 registros por minuto
  async (req, res) => {
    try {
      const result = await authRegister(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /auth/register:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

// Login de usuário - Rate limiting restritivo
router.post('/auth/login', 
  rateLimit(10, 60000), // 10 tentativas por minuto
  async (req, res) => {
    try {
      const result = await authLogin(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /auth/login:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

// Verificação de token - Rate limiting liberal
router.post('/auth/verify', 
  rateLimit(30, 60000), // 30 verificações por minuto
  async (req, res) => {
    try {
      const result = await authVerify(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /auth/verify:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

// Logout de usuário - Rate limiting liberal
router.post('/auth/logout', 
  rateLimit(20, 60000), // 20 logouts por minuto
  async (req, res) => {
    try {
      const result = await authLogout(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /auth/logout:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

// === ROTAS DA APLICAÇÃO ===
// OpenAI - Rate limiting mais restritivo (5 requests por minuto)
router.post('/openai-analyze', 
  rateLimit(5, 60000), // 5 requests por minuto
  authenticateToken, // Autenticação obrigatória
  async (req, res) => {
    try {
      const result = await openaiAnalyze(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /openai-analyze:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

// Supabase - Rate limiting padrão (20 requests por minuto)
router.post('/supabase-query', 
  rateLimit(20, 60000),
  authenticateToken, // Autenticação obrigatória
  async (req, res) => {
    try {
      const result = await supabaseQuery(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /supabase-query:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

router.post('/supabase-insert', 
  rateLimit(15, 60000), // Limite menor para inserções
  authenticateToken, // Autenticação obrigatória
  async (req, res) => {
    try {
      const result = await supabaseInsert(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /supabase-insert:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

router.post('/supabase-update', 
  rateLimit(15, 60000),
  authenticateToken, // Autenticação obrigatória
  async (req, res) => {
    try {
      const result = await supabaseUpdate(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /supabase-update:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

router.post('/supabase-delete', 
  rateLimit(10, 60000), // Limite mais restritivo para exclusões
  authenticateToken, // Autenticação obrigatória
  async (req, res) => {
    try {
      const result = await supabaseDelete(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /supabase-delete:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

router.post('/supabase-upload', 
  rateLimit(10, 60000), // Limite restritivo para uploads
  authenticateToken, // Autenticação obrigatória
  async (req, res) => {
    try {
      const result = await supabaseUpload(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error('Erro em /supabase-upload:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
);

// Rota de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ND Express API funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de status das configurações
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: {
      openai: !!process.env.OPENAI_API_KEY,
      supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

module.exports = router;