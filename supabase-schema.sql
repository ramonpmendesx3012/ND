-- FASE 1: Configuração da Infraestrutura do Supabase
-- Script para criar tabelas, RLS e Storage

-- =============================================
-- 1. CRIAÇÃO DAS TABELAS
-- =============================================

-- Tabela de NDs (Notas de Despesa)
CREATE TABLE IF NOT EXISTS nd_viagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_nd VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  valor_adiantamento DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'aberta',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  total_gastos DECIMAL(10,2) DEFAULT 0,
  saldo DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT
);

-- Tabela de Lançamentos
CREATE TABLE IF NOT EXISTS lancamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nd_viagem_id UUID NOT NULL REFERENCES nd_viagens(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  data_lancamento DATE NOT NULL,
  comprovante_url TEXT,
  observacoes TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_nd_viagens_numero ON nd_viagens(numero_nd);
CREATE INDEX IF NOT EXISTS idx_nd_viagens_status ON nd_viagens(status);
CREATE INDEX IF NOT EXISTS idx_nd_viagens_data_criacao ON nd_viagens(data_criacao);

CREATE INDEX IF NOT EXISTS idx_lancamentos_nd_viagem ON lancamentos(nd_viagem_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_categoria ON lancamentos(categoria);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos(data_lancamento);

-- =============================================
-- 3. CONFIGURAÇÃO DO RLS (Row Level Security)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE nd_viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público total para o papel anon
-- ND Viagens
CREATE POLICY "Acesso público total nd_viagens" ON nd_viagens
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Lançamentos
CREATE POLICY "Acesso público total lancamentos" ON lancamentos
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 4. CONFIGURAÇÃO DO STORAGE
-- =============================================

-- Criar bucket público para comprovantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acesso público para o bucket
CREATE POLICY "Acesso público comprovantes" ON storage.objects
  FOR ALL
  TO anon
  USING (bucket_id = 'comprovantes')
  WITH CHECK (bucket_id = 'comprovantes');

-- =============================================
-- 5. FUNÇÕES AUXILIARES
-- =============================================

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar data_atualizacao na tabela lancamentos
CREATE TRIGGER trigger_lancamentos_data_atualizacao
  BEFORE UPDATE ON lancamentos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- Função para calcular totais da ND
CREATE OR REPLACE FUNCTION calcular_totais_nd(nd_id UUID)
RETURNS VOID AS $$
DECLARE
  total_gastos_calc DECIMAL(10,2);
  valor_adiantamento_atual DECIMAL(10,2);
  saldo_calc DECIMAL(10,2);
BEGIN
  -- Calcular total de gastos
  SELECT COALESCE(SUM(valor), 0) INTO total_gastos_calc
  FROM lancamentos
  WHERE nd_viagem_id = nd_id;
  
  -- Obter valor do adiantamento
  SELECT valor_adiantamento INTO valor_adiantamento_atual
  FROM nd_viagens
  WHERE id = nd_id;
  
  -- Calcular saldo
  saldo_calc := valor_adiantamento_atual - total_gastos_calc;
  
  -- Atualizar a ND
  UPDATE nd_viagens
  SET 
    total_gastos = total_gastos_calc,
    saldo = saldo_calc
  WHERE id = nd_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totais quando lançamentos são modificados
CREATE OR REPLACE FUNCTION trigger_recalcular_totais()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calcular_totais_nd(OLD.nd_viagem_id);
    RETURN OLD;
  ELSE
    PERFORM calcular_totais_nd(NEW.nd_viagem_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lancamentos_recalcular_totais
  AFTER INSERT OR UPDATE OR DELETE ON lancamentos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalcular_totais();

-- =============================================
-- 6. DADOS INICIAIS (OPCIONAL)
-- =============================================

-- Inserir uma ND de exemplo para teste
INSERT INTO nd_viagens (numero_nd, descricao, valor_adiantamento, status)
VALUES ('ND001', 'ND de Teste - Configuração Inicial', 1000.00, 'aberta')
ON CONFLICT (numero_nd) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE nd_viagens IS 'Tabela principal de Notas de Despesa';
COMMENT ON TABLE lancamentos IS 'Tabela de lançamentos/gastos de cada ND';

COMMENT ON COLUMN nd_viagens.numero_nd IS 'Número único da ND (ex: ND001, ND002)';
COMMENT ON COLUMN nd_viagens.status IS 'Status da ND: aberta, fechada, cancelada';
COMMENT ON COLUMN nd_viagens.saldo IS 'Saldo = valor_adiantamento - total_gastos';

COMMENT ON COLUMN lancamentos.categoria IS 'Categoria do gasto: alimentacao, transporte, hospedagem, etc';
COMMENT ON COLUMN lancamentos.comprovante_url IS 'URL do comprovante no Storage do Supabase';