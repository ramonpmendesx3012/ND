# 🗄️ Configuração Completa do Supabase - ND Express

Este guia fornece instruções passo a passo para configurar o banco de dados Supabase para o sistema ND Express.

## 📋 Pré-requisitos

- Conta no Supabase (https://supabase.com)
- Projeto criado no Supabase
- Acesso ao Editor SQL do Supabase

## 🚀 Passo a Passo da Configuração

### **ETAPA 1: Executar Script SQL**

1. **Acesse o Supabase Dashboard**
   - Faça login em https://supabase.com
   - Selecione seu projeto

2. **Abra o Editor SQL**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Execute o Script de Configuração**
   - Copie todo o conteúdo do arquivo `supabase-setup.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

### **ETAPA 2: Configurar Storage**

1. **Criar Bucket de Imagens**
   - No menu lateral, clique em "Storage"
   - Clique em "Create bucket"
   - Configure:
     - **Nome**: `comprovantes`
     - **Público**: ✅ Marcar como público
     - **Allowed file types**: `image/jpeg, image/png, image/webp`

2. **Configurar Políticas do Storage**
   - Clique no bucket "comprovantes"
   - Vá para a aba "Policies"
   - Adicione as seguintes políticas:

```sql
-- Política para permitir upload
CREATE POLICY "Permitir upload público" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'comprovantes');

-- Política para permitir visualização
CREATE POLICY "Permitir visualização pública" ON storage.objects
FOR SELECT USING (bucket_id = 'comprovantes');
```

### **ETAPA 3: Verificar Configuração**

1. **Verificar Tabelas Criadas**
   - Execute no SQL Editor:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('nd_viagens', 'lancamentos');
```

2. **Verificar Políticas RLS**
   - Execute no SQL Editor:
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

3. **Testar Inserção de Dados**
   - Execute no SQL Editor:
```sql
SELECT * FROM public.nd_viagens;
```

## 📊 Estrutura do Banco de Dados

### **Tabela: `nd_viagens`**
| Campo | Tipo | Descrição |
|-------|------|----------|
| id | UUID | Chave primária |
| numero_nd | TEXT | Número da ND (ex: ND001) |
| descricao | TEXT | Descrição da viagem/evento |
| status | TEXT | 'aberta' ou 'fechada' |
| total_calculado | NUMERIC | Total automático via trigger |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

### **Tabela: `lancamentos`**
| Campo | Tipo | Descrição |
|-------|------|----------|
| id | UUID | Chave primária |
| nd_id | UUID | Referência para nd_viagens |
| data_despesa | DATE | Data da despesa |
| valor | NUMERIC | Valor da despesa |
| categoria | TEXT | alimentacao, deslocamento, hospedagem, outros |
| descricao | TEXT | Descrição livre da despesa |
| estabelecimento | TEXT | Nome do estabelecimento |
| imagem_url | TEXT | URL do comprovante |
| confianca | INTEGER | Nível de confiança da IA (0-100) |
| created_at | TIMESTAMPTZ | Data de criação |

## 🔧 Funcionalidades Automáticas

### **Trigger de Atualização de Total**
- **Função**: `atualizar_total_nd()`
- **Trigger**: `on_lancamento_change`
- **Ação**: Atualiza automaticamente o `total_calculado` da ND quando lançamentos são inseridos, atualizados ou removidos

### **Políticas de Segurança (RLS)**
- **Acesso Público**: Configurado para permitir operações sem autenticação
- **Ideal para**: Protótipos e aplicações internas
- **Produção**: Considere implementar autenticação baseada em usuário

## 🧪 Testes Recomendados

### **1. Teste de Inserção de ND**
```sql
INSERT INTO public.nd_viagens (numero_nd, descricao)
VALUES ('ND002', 'Teste de Configuração');
```

### **2. Teste de Inserção de Lançamento**
```sql
INSERT INTO public.lancamentos (
    nd_id, 
    data_despesa, 
    valor, 
    categoria, 
    descricao, 
    estabelecimento, 
    imagem_url
) VALUES (
    (SELECT id FROM public.nd_viagens WHERE numero_nd = 'ND002'),
    '2025-01-15',
    25.50,
    'alimentacao',
    'Almoço de negócios',
    'Restaurante Teste',
    'https://exemplo.com/imagem.jpg'
);
```

### **3. Verificar Trigger de Total**
```sql
SELECT numero_nd, total_calculado 
FROM public.nd_viagens 
WHERE numero_nd = 'ND002';
```

## 📱 Configuração da Aplicação

Após configurar o banco, atualize o arquivo `config.js` com as credenciais do seu projeto:

```javascript
const SUPABASE_CONFIG = {
    URL: 'https://SEU-PROJETO.supabase.co',
    ANON_KEY: 'SUA-CHAVE-ANONIMA'
};
```

## 🔍 Queries Úteis para Desenvolvimento

### **Listar todas as NDs**
```sql
SELECT numero_nd, descricao, status, total_calculado, created_at 
FROM public.nd_viagens 
ORDER BY created_at DESC;
```

### **Relatório por Categoria**
```sql
SELECT categoria, COUNT(*) as quantidade, SUM(valor) as total
FROM public.lancamentos
GROUP BY categoria
ORDER BY total DESC;
```

### **Lançamentos de uma ND específica**
```sql
SELECT l.*, nv.numero_nd 
FROM public.lancamentos l
JOIN public.nd_viagens nv ON l.nd_id = nv.id
WHERE nv.numero_nd = 'ND001'
ORDER BY l.data_despesa DESC;
```

## ⚠️ Considerações de Segurança

### **Para Produção:**
1. **Implementar Autenticação**: Substituir políticas públicas por baseadas em `auth.uid()`
2. **Validação de Dados**: Adicionar validações mais rigorosas
3. **Backup Regular**: Configurar backups automáticos
4. **Monitoramento**: Implementar logs e alertas

### **Para Desenvolvimento:**
- As configurações atuais são ideais para prototipagem
- Acesso público facilita testes e desenvolvimento
- Triggers garantem consistência dos dados

## 🎯 Próximos Passos

1. ✅ Executar `supabase-setup.sql`
2. ✅ Configurar bucket "comprovantes"
3. ✅ Testar inserção de dados
4. ✅ Atualizar credenciais na aplicação
5. ✅ Testar integração completa

---

**🚀 Configuração concluída! O banco de dados está pronto para uso com o ND Express.**