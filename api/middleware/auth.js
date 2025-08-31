// Middleware de autenticação para APIs
// Implementa verificação de JWT e rate limiting

const jwt = require('jsonwebtoken');

// Rate limiting em memória (para produção, usar Redis)
const rateLimitStore = new Map();

/**
 * Middleware de autenticação JWT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // Para desenvolvimento, permitir acesso sem token se JWT_SECRET não estiver definido
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET não configurado - modo desenvolvimento ativo');
    return next();
  }
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso requerido',
      message: 'Forneça um token Bearer válido no header Authorization' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Token inválido',
        message: 'O token fornecido é inválido ou expirou' 
      });
    }
    
    req.user = user;
    next();
  });
}

/**
 * Middleware de rate limiting
 * @param {number} maxRequests - Máximo de requests por janela
 * @param {number} windowMs - Janela de tempo em milissegundos
 * @returns {Function} Middleware function
 */
function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpar entradas antigas
    if (rateLimitStore.has(clientId)) {
      const requests = rateLimitStore.get(clientId).filter(time => time > windowStart);
      rateLimitStore.set(clientId, requests);
    } else {
      rateLimitStore.set(clientId, []);
    }
    
    const requests = rateLimitStore.get(clientId);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit excedido',
        message: `Máximo de ${maxRequests} requests por ${windowMs / 1000} segundos`,
        retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
      });
    }
    
    // Adicionar request atual
    requests.push(now);
    rateLimitStore.set(clientId, requests);
    
    // Headers informativos
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - requests.length,
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });
    
    next();
  };
}

/**
 * Middleware de validação de API key (alternativa ao JWT)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  // Para desenvolvimento, permitir acesso sem API key se não estiver configurada
  if (!process.env.API_KEY) {
    console.warn('⚠️ API_KEY não configurada - modo desenvolvimento ativo');
    return next();
  }
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'API key inválida',
      message: 'Forneça uma API key válida no header X-API-Key'
    });
  }
  
  next();
}

/**
 * Limpa o store de rate limiting (útil para testes)
 */
function clearRateLimitStore() {
  rateLimitStore.clear();
}

/**
 * Gera um token JWT para desenvolvimento/testes
 * @param {Object} payload - Dados do usuário
 * @param {string} expiresIn - Tempo de expiração
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = '24h') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

module.exports = {
  authenticateToken,
  rateLimit,
  validateApiKey,
  clearRateLimitStore,
  generateToken
};