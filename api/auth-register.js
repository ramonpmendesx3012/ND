// API de registro de usuários
// Permite criar novos usuários no sistema

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
    const { nome, email, cpf, senha } = req.body;
    
    // Validar dados obrigatórios
    if (!nome || !email || !cpf || !senha) {
      return res.status(400).json({
        error: 'Dados obrigatórios ausentes',
        message: 'Nome, email, CPF e senha são obrigatórios'
      });
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido',
        message: 'Formato de email inválido'
      });
    }
    
    // Validar CPF (formato básico)
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        error: 'CPF inválido',
        message: 'CPF deve ter 11 dígitos'
      });
    }
    
    // Validar senha (mínimo 6 caracteres)
    if (senha.length < 6) {
      return res.status(400).json({
        error: 'Senha muito fraca',
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }
    
    // Verificar se email já existe
    const { data: emailExistente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (emailExistente) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        message: 'Este email já está em uso'
      });
    }
    
    // Verificar se CPF já existe
    const cpfFormatado = formatarCPF(cpfLimpo);
    const { data: cpfExistente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('cpf', cpfFormatado)
      .single();
    
    if (cpfExistente) {
      return res.status(409).json({
        error: 'CPF já cadastrado',
        message: 'Este CPF já está em uso'
      });
    }
    
    // Criptografar senha
    const saltRounds = 12;
    const senhaHash = await bcrypt.hash(senha, saltRounds);
    
    // Criar usuário no banco
    const { data: novoUsuario, error: erroInsercao } = await supabase
      .from('usuarios')
      .insert({
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        cpf: cpfFormatado,
        senha_hash: senhaHash,
        ativo: false // Usuário criado como inativo
      })
      .select('id, nome, email, cpf, ativo, data_criacao')
      .single();
    
    if (erroInsercao) {
      console.error('Erro ao criar usuário:', erroInsercao);
      return res.status(500).json({
        error: 'Erro interno',
        message: 'Erro ao criar usuário'
      });
    }
    
    // Log da criação
    console.log(`✅ Usuário criado: ${email} (${novoUsuario.id})`);
    
    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso! Aguarde a ativação pelo administrador.',
      data: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        ativo: novoUsuario.ativo,
        data_criacao: novoUsuario.data_criacao
      }
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro inesperado ao processar registro'
    });
  }
};

/**
 * Formatar CPF com pontos e traço
 * @param {string} cpf - CPF apenas com números
 * @returns {string} CPF formatado
 */
function formatarCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Validar CPF (algoritmo básico)
 * @param {string} cpf - CPF apenas com números
 * @returns {boolean} True se válido
 */
function validarCPF(cpf) {
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  
  // Calcular primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto < 2 ? 0 : resto;
  
  // Calcular segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto < 2 ? 0 : resto;
  
  // Verificar se os dígitos calculados conferem
  return digito1 === parseInt(cpf.charAt(9)) && digito2 === parseInt(cpf.charAt(10));
}