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

// Middleware de log para debug
router.use((req, res, next) => {
  console.log(`📡 API ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rotas da API com segurança

// OpenAI - Rate limiting mais restritivo (5 requests por minuto)
router.post('/openai-analyze', 
  rateLimit(5, 60000), // 5 requests por minuto
  validateApiKey, // Validação de API key
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