-- FASE 1: Adicionar coluna valor_adiantamento na tabela nd_viagens
-- Este comando adiciona um campo para armazenar o valor do adiantamento de viagem

ALTER TABLE public.nd_viagens 
ADD COLUMN valor_adiantamento NUMERIC(10, 2) DEFAULT 0.00;

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'nd_viagens' 
AND column_name = 'valor_adiantamento';