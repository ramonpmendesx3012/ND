// API de logout
// Invalida token e encerra sessão do usuário

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(400).json({
        error: 'Token não fornecido',
        message: 'Token de autenticação é obrigatório para logout'
      });
    }
    
    // Verificar token JWT (mesmo que inválido, tentamos fazer logout)
    const jwtSecret = process.env.JWT_SECRET || 'nd-express-secret-key';
    let decoded;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      // Token inválido ou expirado, mas ainda tentamos invalidar a sessão
      console.log('Token inválido no logout, mas continuando...');
    }
    
    // Criar hash do token para buscar sessão
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Invalidar sessão específica
    const { data: sessaoInvalidada, error: erroInvalidacao } = await supabase
      .from('sessoes')
      .update({ ativo: false })
      .eq('token_hash', tokenHash)
      .select('id, usuario_id')
      .single();
    
    if (erroInvalidacao) {
      console.log('Sessão não encontrada ou já inativa');
    }
    
    // Se conseguimos decodificar o token, limpar outras sessões expiradas do usuário
    if (decoded && decoded.userId) {
      await limparSessoesExpiradas(decoded.userId);
      console.log(`✅ Logout realizado: ${decoded.email} (${decoded.userId})`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
      data: {
        sessao_invalidada: !!sessaoInvalidada,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro inesperado ao processar logout'
    });
  }
};

/**
 * Limpar todas as sessões expiradas do usuário
 * @param {string} usuarioId - ID do usuário
 */
async function limparSessoesExpiradas(usuarioId) {
  try {
    const { data: sessoesLimpas } = await supabase
      .from('sessoes')
      .delete()
      .eq('usuario_id', usuarioId)
      .lt('data_expiracao', new Date().toISOString())
      .select('id');
    
    if (sessoesLimpas && sessoesLimpas.length > 0) {
      console.log(`🧹 Limpas ${sessoesLimpas.length} sessões expiradas do usuário ${usuarioId}`);
    }
  } catch (error) {
    console.error('Erro ao limpar sessões expiradas:', error);
  }
}