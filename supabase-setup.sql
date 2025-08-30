-- =====================================================
-- CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS SUPABASE
-- ND EXPRESS - Sistema de Notas de Despesa
-- =====================================================

-- FASE 1: CRIAÇÃO DAS TABELAS
-- =====================================================

-- 1.1. Tabela nd_viagens
-- Esta tabela armazenará cada "Nota de Despesa" como uma entidade única
CREATE TABLE public.nd_viagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_nd TEXT NOT NULL UNIQUE,
    descricao TEXT,
    status TEXT NOT NULL CHECK (status IN ('aberta', 'fechada')) DEFAULT 'aberta',
    total_calculado NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários para clareza
COMMENT ON TABLE public.nd_viagens IS 'Armazena cada Nota de Despesa (ND) como uma viagem ou evento.';
COMMENT ON COLUMN public.nd_viagens.numero_nd IS 'Número sequencial único gerado pela aplicação (ex: ND001).';
COMMENT ON COLUMN public.nd_viagens.status IS 'Controla se a ND está ''aberta'' para novos lançamentos ou ''fechada''.';
COMMENT ON COLUMN public.nd_viagens.total_calculado IS 'Valor total da ND, pode ser atualizado via trigger.';

-- 1.2. Tabela lancamentos
-- Esta tabela armazenará cada despesa individual, vinculada a uma nd_viagem
CREATE TABLE public.lancamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nd_id UUID NOT NULL REFERENCES public.nd_viagens(id) ON DELETE CASCADE,
    data_despesa DATE NOT NULL,
    valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
    categoria TEXT NOT NULL CHECK (categoria IN ('Alimentação', 'Deslocamento', 'Hospedagem', 'Outros')),
    descricao TEXT NOT NULL,
    estabelecimento TEXT,
    imagem_url TEXT NOT NULL,
    confianca INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários para clareza
COMMENT ON TABLE public.lancamentos IS 'Registra cada comprovante de despesa individual.';
COMMENT ON COLUMN public.lancamentos.nd_id IS 'Chave estrangeira que vincula a despesa a uma ND específica.';
COMMENT ON COLUMN public.lancamentos.valor IS 'Valor da despesa, deve ser positivo.';
COMMENT ON COLUMN public.lancamentos.categoria IS 'Categoria fixa: alimentacao, deslocamento, hospedagem, outros.';
COMMENT ON COLUMN public.lancamentos.descricao IS 'Descrição livre da despesa, editável pelo usuário.';
COMMENT ON COLUMN public.lancamentos.estabelecimento IS 'Nome do estabelecimento onde foi feita a compra.';
COMMENT ON COLUMN public.lancamentos.imagem_url IS 'URL pública do comprovante no Supabase Storage.';
COMMENT ON COLUMN public.lancamentos.confianca IS 'Nível de confiança da IA na extração dos dados (0-100).';

-- =====================================================
-- FASE 2: CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar Row Level Security nas tabelas
ALTER TABLE public.nd_viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela nd_viagens
-- Permite acesso público total (ideal para protótipo)
CREATE POLICY "Permitir acesso público total para nd_viagens"
ON public.nd_viagens
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para a tabela lancamentos
-- Permite acesso público total (ideal para protótipo)
CREATE POLICY "Permitir acesso público total para lancamentos"
ON public.lancamentos
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- FASE 3: AUTOMAÇÃO COM FUNÇÕES E TRIGGERS
-- =====================================================

-- 3.1. Função para atualizar total da ND automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_total_nd()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.nd_viagens
    SET total_calculado = (
        SELECT COALESCE(SUM(valor), 0)
        FROM public.lancamentos
        WHERE nd_id = COALESCE(NEW.nd_id, OLD.nd_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.nd_id, OLD.nd_id);
    RETURN NULL; -- O resultado não importa para um trigger AFTER
END;
$$ LANGUAGE plpgsql;

-- 3.2. Trigger para atualizar total automaticamente
CREATE TRIGGER on_lancamento_change
AFTER INSERT OR UPDATE OR DELETE
ON public.lancamentos
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_total_nd();

-- =====================================================
-- FASE 4: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por número da ND
CREATE INDEX idx_nd_viagens_numero ON public.nd_viagens(numero_nd);

-- Índice para busca de lançamentos por ND
CREATE INDEX idx_lancamentos_nd_id ON public.lancamentos(nd_id);

-- Índice para busca por data
CREATE INDEX idx_lancamentos_data ON public.lancamentos(data_despesa);

-- Índice para busca por categoria
CREATE INDEX idx_lancamentos_categoria ON public.lancamentos(categoria);

-- =====================================================
-- FASE 5: DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir uma ND inicial para testes
INSERT INTO public.nd_viagens (numero_nd, descricao, status)
VALUES ('ND001', 'Viagem de Negócios - Teste', 'aberta');

-- =====================================================
-- FASE 6: VERIFICAÇÃO DA ESTRUTURA
-- =====================================================

-- Query para verificar se as tabelas foram criadas corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('nd_viagens', 'lancamentos')
ORDER BY table_name, ordinal_position;

-- Query para verificar as políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('nd_viagens', 'lancamentos');

-- =====================================================
-- INSTRUÇÕES DE CONFIGURAÇÃO DO STORAGE
-- =====================================================

/*
PARA CONFIGURAR O SUPABASE STORAGE:

1. Acesse o painel do Supabase Storage
2. Crie um novo bucket com as seguintes configurações:
   - Nome: "comprovantes"
   - Público: SIM (marcar como público)
   - Allowed MIME types: image/jpeg, image/png, image/webp

3. Configure as políticas do bucket:
   - SELECT: Permitir para role 'anon'
   - INSERT: Permitir para role 'anon'
   - UPDATE: Permitir para role 'anon' (opcional)
   - DELETE: Permitir para role 'anon' (opcional)

4. Exemplo de política para o bucket:
   
   -- Política para permitir upload de imagens
   CREATE POLICY "Permitir upload público" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'comprovantes');
   
   -- Política para permitir visualização de imagens
   CREATE POLICY "Permitir visualização pública" ON storage.objects
   FOR SELECT USING (bucket_id = 'comprovantes');
*/

-- =====================================================
-- QUERIES ÚTEIS PARA DESENVOLVIMENTO
-- =====================================================

-- Buscar todas as NDs com seus totais
-- SELECT numero_nd, descricao, status, total_calculado, created_at FROM public.nd_viagens ORDER BY created_at DESC;

-- Buscar lançamentos de uma ND específica
-- SELECT l.*, nv.numero_nd FROM public.lancamentos l
-- JOIN public.nd_viagens nv ON l.nd_id = nv.id
-- WHERE nv.numero_nd = 'ND001'
-- ORDER BY l.data_despesa DESC;

-- Relatório de despesas por categoria
-- SELECT categoria, COUNT(*) as quantidade, SUM(valor) as total
-- FROM public.lancamentos
-- GROUP BY categoria
-- ORDER BY total DESC;

-- =====================================================
-- FIM DA CONFIGURAÇÃO
-- =====================================================

-- Verificação final
SELECT 'Configuração do banco de dados concluída com sucesso!' as status;