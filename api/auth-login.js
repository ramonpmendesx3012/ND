// API de login de usuários
// Autentica usuários e gera tokens JWT

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const { email, senha } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    // Validar dados obrigatórios
    if (!email || !senha) {
      return res.status(400).json({
        error: 'Dados obrigatórios ausentes',
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Buscar usuário por email
    const { data: usuario, error: erroConsulta } = await supabase
      .from('usuarios')
      .select('id, nome, email, cpf, senha_hash, ativo, tentativas_login, bloqueado_ate')
      .eq('email', email.toLowerCase())
      .single();
    
    if (erroConsulta || !usuario) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }
    
    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      return res.status(403).json({
        error: 'Usuário inativo',
        message: 'Sua conta ainda não foi ativada pelo administrador'
      });
    }
    
    // Verificar se usuário está bloqueado
    if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
      const tempoRestante = Math.ceil((new Date(usuario.bloqueado_ate) - new Date()) / 1000 / 60);
      return res.status(423).json({
        error: 'Usuário bloqueado',
        message: `Conta bloqueada. Tente novamente em ${tempoRestante} minutos`
      });
    }
    
    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    
    if (!senhaValida) {
      // Incrementar tentativas de login
      const novasTentativas = (usuario.tentativas_login || 0) + 1;
      let bloqueadoAte = null;
      
      // Bloquear após 5 tentativas por 30 minutos
      if (novasTentativas >= 5) {
        bloqueadoAte = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
      }
      
      await supabase
        .from('usuarios')
        .update({
          tentativas_login: novasTentativas,
          bloqueado_ate: bloqueadoAte
        })
        .eq('id', usuario.id);
      
      console.log(`❌ Login falhado: ${email} (${novasTentativas} tentativas)`);
      
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos',
        tentativas_restantes: Math.max(0, 5 - novasTentativas)
      });
    }
    
    // Login bem-sucedido - resetar tentativas
    await supabase
      .from('usuarios')
      .update({
        tentativas_login: 0,
        bloqueado_ate: null,
        ultimo_login: new Date().toISOString()
      })
      .eq('id', usuario.id);
    
    // Gerar token JWT
    const tokenPayload = {
      userId: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'nd-express-secret-key';
    const token = jwt.sign(tokenPayload, jwtSecret);
    
    // Criar hash do token para armazenar na sessão
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Salvar sessão no banco
    const { error: erroSessao } = await supabase
      .from('sessoes')
      .insert({
        usuario_id: usuario.id,
        token_hash: tokenHash,
        ip_address: clientIP,
        user_agent: userAgent,
        data_expiracao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      });
    
    if (erroSessao) {
      console.error('Erro ao criar sessão:', erroSessao);
    }
    
    // Limpar sessões expiradas (async)
    limparSessoesExpiradas(usuario.id);
    
    console.log(`✅ Login bem-sucedido: ${email} (${usuario.id})`);
    
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cpf: usuario.cpf
        },
        expires_in: 24 * 60 * 60 // 24 horas em segundos
      }
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro inesperado ao processar login'
    });
  }
};

/**
 * Limpar sessões expiradas do usuário
 * @param {string} usuarioId - ID do usuário
 */
async function limparSessoesExpiradas(usuarioId) {
  try {
    await supabase
      .from('sessoes')
      .delete()
      .eq('usuario_id', usuarioId)
      .lt('data_expiracao', new Date().toISOString());
  } catch (error) {
    console.error('Erro ao limpar sessões expiradas:', error);
  }
}