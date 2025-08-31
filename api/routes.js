// Rotas da API - ND Express
// Centraliza todas as rotas das APIs backend

const express = require('express');
const router = express.Router();
const path = require('path');

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

// Rotas da API
router.post('/openai-analyze', async (req, res) => {
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
});

router.post('/supabase-query', async (req, res) => {
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
});

router.post('/supabase-insert', async (req, res) => {
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
});

router.post('/supabase-update', async (req, res) => {
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
});

router.post('/supabase-delete', async (req, res) => {
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
});

router.post('/supabase-upload', async (req, res) => {
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
});

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