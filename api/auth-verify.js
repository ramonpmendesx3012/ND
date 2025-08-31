// API de verificação de token
// Valida tokens JWT e retorna dados do usuário

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Token não fornecido',
        message: 'Token de autenticação é obrigatório'
      });
    }
    
    // Verificar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'nd-express-secret-key';
    let decoded;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          message: 'Token de autenticação expirado'
        });
      }
      
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Token de autenticação inválido'
      });
    }
    
    // Verificar se sessão existe e está ativa
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const { data: sessao, error: erroSessao } = await supabase
      .from('sessoes')
      .select('id, usuario_id, data_expiracao, ativo')
      .eq('token_hash', tokenHash)
      .eq('ativo', true)
      .single();
    
    if (erroSessao || !sessao) {
      return res.status(401).json({
        error: 'Sessão inválida',
        message: 'Sessão não encontrada ou inativa'
      });
    }
    
    // Verificar se sessão não expirou
    if (new Date(sessao.data_expiracao) < new Date()) {
      // Marcar sessão como inativa
      await supabase
        .from('sessoes')
        .update({ ativo: false })
        .eq('id', sessao.id);
      
      return res.status(401).json({
        error: 'Sessão expirada',
        message: 'Sessão de autenticação expirada'
      });
    }
    
    // Buscar dados atualizados do usuário
    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('id, nome, email, cpf, ativo, ultimo_login')
      .eq('id', decoded.userId)
      .single();
    
    if (erroUsuario || !usuario) {
      return res.status(401).json({
        error: 'Usuário não encontrado',
        message: 'Usuário não existe'
      });
    }
    
    // Verificar se usuário ainda está ativo
    if (!usuario.ativo) {
      // Invalidar sessão
      await supabase
        .from('sessoes')
        .update({ ativo: false })
        .eq('id', sessao.id);
      
      return res.status(403).json({
        error: 'Usuário inativo',
        message: 'Conta foi desativada pelo administrador'
      });
    }
    
    // Token válido - retornar dados do usuário
    return res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cpf: usuario.cpf,
          ultimo_login: usuario.ultimo_login
        },
        sessao: {
          id: sessao.id,
          data_expiracao: sessao.data_expiracao
        },
        token_info: {
          issued_at: new Date(decoded.iat * 1000),
          expires_at: new Date(decoded.exp * 1000),
          time_remaining: decoded.exp - Math.floor(Date.now() / 1000)
        }
      }
    });
    
  } catch (error) {
    console.error('Erro na verificação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro inesperado ao verificar token'
    });
  }
};