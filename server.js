// Servidor Node.js para ND Express
// Suporte às APIs backend com Express

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use(express.static('.'));

// Importar e usar as rotas da API
app.use('/api', require('./api/routes'));

// Rota principal - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ND Express rodando em http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI configurado: ${process.env.OPENAI_API_KEY ? 'Sim' : 'Não'}`);
  console.log(`🗄️ Supabase configurado: ${process.env.SUPABASE_URL ? 'Sim' : 'Não'}`);
});

module.exports = app;