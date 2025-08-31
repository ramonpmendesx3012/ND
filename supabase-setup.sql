-- ND Express - Database Setup
-- Sistema de Gestão de Notas de Despesa

-- Tabela nd_viagens
-- Armazena cada Nota de Despesa como uma entidade única
CREATE TABLE public.nd_viagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_nd TEXT NOT NULL UNIQUE,
    descricao TEXT,
    status TEXT NOT NULL CHECK (status IN ('aberta', 'fechada')) DEFAULT 'aberta',
    total_calculado NUMERIC(10, 2) DEFAULT 0.00,
    valor_adiantamento NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela lancamentos
-- Registra cada comprovante de despesa individual
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

-- Configuração de segurança (RLS)
ALTER TABLE public.nd_viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (para prototipagem)
CREATE POLICY "Permitir acesso público total para nd_viagens"
ON public.nd_viagens
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir acesso público total para lancamentos"
ON public.lancamentos
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para atualizar total da ND automaticamente
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
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar total automaticamente
CREATE TRIGGER on_lancamento_change
AFTER INSERT OR UPDATE OR DELETE
ON public.lancamentos
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_total_nd();

-- Índices para performance
CREATE INDEX idx_nd_viagens_numero ON public.nd_viagens(numero_nd);
CREATE INDEX idx_lancamentos_nd_id ON public.lancamentos(nd_id);
CREATE INDEX idx_lancamentos_data ON public.lancamentos(data_despesa);
CREATE INDEX idx_lancamentos_categoria ON public.lancamentos(categoria);

-- Inserir ND inicial para testes
INSERT INTO public.nd_viagens (numero_nd, descricao, status)
VALUES ('ND001', 'Viagem de Negócios - Inicial', 'aberta');

-- Verificação da estrutura
SELECT 'Configuração do banco de dados concluída com sucesso!' as status;

/*
CONFIGURAÇÃO DO STORAGE:

1. Acesse o painel do Supabase Storage
2. Crie um novo bucket:
   - Nome: "comprovantes"
   - Público: SIM
   - Tipos permitidos: image/jpeg, image/png, image/webp

3. Configure as políticas do bucket:
   
   -- Política para upload
   CREATE POLICY "Permitir upload público" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'comprovantes');
   
   -- Política para visualização
   CREATE POLICY "Permitir visualização pública" ON storage.objects
   FOR SELECT USING (bucket_id = 'comprovantes');
*/