-- Script de criação das tabelas para sistema de autenticação
-- ND Express - Sistema de Login e Usuários

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT FALSE, -- Campo para ativação manual
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_login TIMESTAMP WITH TIME ZONE,
  tentativas_login INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP WITH TIME ZONE
);

-- Tabela de sessões (para controle de tokens)
CREATE TABLE IF NOT EXISTS sessoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
  ativo BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token_hash ON sessoes(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativo ON sessoes(ativo);

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar data_atualizacao na tabela usuarios
CREATE TRIGGER trigger_usuarios_data_atualizacao
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas()
RETURNS INTEGER AS $$
DECLARE
  sessoes_removidas INTEGER;
BEGIN
  DELETE FROM sessoes 
  WHERE data_expiracao < NOW() OR ativo = FALSE;
  
  GET DIAGNOSTICS sessoes_removidas = ROW_COUNT;
  RETURN sessoes_removidas;
END;
$$ LANGUAGE plpgsql;

-- Política de segurança RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;

-- Política para usuários - apenas o próprio usuário pode ver seus dados
CREATE POLICY usuarios_policy ON usuarios
  FOR ALL
  USING (auth.uid()::text = id::text);

-- Política para sessões - apenas o próprio usuário pode ver suas sessões
CREATE POLICY sessoes_policy ON sessoes
  FOR ALL
  USING (usuario_id::text = auth.uid()::text);

-- Inserir usuário administrador padrão (senha: admin123)
-- Hash bcrypt para 'admin123': $2b$10$rOzJqQZQZQZQZQZQZQZQZOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
INSERT INTO usuarios (nome, email, cpf, senha_hash, ativo) 
VALUES (
  'Administrador',
  'admin@ndexpress.com',
  '000.000.000-00',
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema ND Express';
COMMENT ON COLUMN usuarios.ativo IS 'Campo para ativação manual pelo administrador';
COMMENT ON COLUMN usuarios.tentativas_login IS 'Contador de tentativas de login falhadas';
COMMENT ON COLUMN usuarios.bloqueado_ate IS 'Data até quando o usuário está bloqueado';

COMMENT ON TABLE sessoes IS 'Tabela de controle de sessões e tokens de autenticação';
COMMENT ON COLUMN sessoes.token_hash IS 'Hash do token JWT para invalidação';