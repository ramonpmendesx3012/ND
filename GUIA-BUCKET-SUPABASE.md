# 📁 Guia Passo a Passo: Configurar Bucket "comprovantes" no Supabase

**Para iniciantes - Instruções detalhadas com capturas de tela**

---

## 🎯 O que vamos fazer?

Vamos criar um "bucket" (pasta) no Supabase para armazenar as imagens dos comprovantes de despesa. É como criar uma pasta no Google Drive, mas para nossa aplicação.

---

## 📋 Pré-requisitos

- ✅ Conta no Supabase (se não tem, crie em https://supabase.com)
- ✅ Projeto criado no Supabase
- ✅ Estar logado no painel do Supabase

---

## 🚀 Passo a Passo Detalhado

### **PASSO 1: Acessar o Supabase**

1. **Abra seu navegador** (Chrome, Firefox, Edge, etc.)
2. **Vá para:** https://supabase.com
3. **Clique em "Sign In"** (no canto superior direito)
4. **Faça login** com sua conta
5. **Selecione seu projeto** na lista de projetos

---

### **PASSO 2: Navegar para Storage**

1. **No painel lateral esquerdo**, procure por "Storage"
2. **Clique em "Storage"**
   - Você verá um ícone de pasta 📁
   - Está geralmente na seção "Database" ou "Storage"

**💡 Dica:** Se não encontrar, procure por um menu com ícone de três linhas (☰) no canto superior esquerdo.

---

### **PASSO 3: Criar o Bucket**

1. **Na página do Storage**, você verá:
   - Uma lista de buckets (pode estar vazia)
   - Um botão "Create bucket" ou "New bucket"

2. **Clique em "Create bucket"** ou "New bucket"

3. **Preencha o formulário:**
   ```
   📝 Nome do bucket: comprovantes
   🔓 Public bucket: ✅ MARCAR (muito importante!)
   📄 File size limit: 50MB (padrão está bom)
   🎨 Allowed MIME types: image/jpeg, image/png, image/webp
   ```

4. **Clique em "Create bucket"**

---

### **PASSO 4: Configurar como Público**

**⚠️ MUITO IMPORTANTE:** O bucket precisa ser público para a aplicação funcionar.

1. **Após criar o bucket**, você verá ele na lista
2. **Clique no bucket "comprovantes"**
3. **Procure por "Settings" ou "Configurações"**
4. **Certifique-se que está marcado:**
   - ✅ **Public bucket** = SIM/TRUE
   - ✅ **Public access** = ENABLED

---

### **PASSO 5: Configurar Políticas de Acesso**

1. **Dentro do bucket "comprovantes"**, procure por:
   - "Policies" ou "Políticas"
   - "Security" ou "Segurança"

2. **Clique em "Policies"**

3. **Você precisa criar 2 políticas:**

#### **Política 1: Permitir Upload**
```
📝 Nome: Permitir upload público
🎯 Operation: INSERT
👤 Target roles: anon
✅ Policy: WITH CHECK (bucket_id = 'comprovantes')
```

#### **Política 2: Permitir Visualização**
```
📝 Nome: Permitir visualização pública
🎯 Operation: SELECT
👤 Target roles: anon
✅ Policy: USING (bucket_id = 'comprovantes')
```

4. **Clique em "Save" ou "Salvar"** para cada política

---

## ✅ Como Verificar se Está Funcionando

### **Teste Rápido:**

1. **Vá para o bucket "comprovantes"**
2. **Tente fazer upload de uma imagem qualquer**
3. **Se conseguir fazer upload**, está funcionando! 🎉

### **Teste na Aplicação:**

1. **Abra:** http://localhost:8000/test-database.html
2. **Execute o "Teste Completo de Integração"**
3. **Se todos os testes passarem**, está perfeito! ✅

---

## 🆘 Problemas Comuns e Soluções

### **❌ Erro: "Bucket not found"**
**Solução:** Verifique se o nome está exatamente "comprovantes" (sem espaços, acentos)

### **❌ Erro: "Access denied"**
**Solução:** 
1. Certifique-se que o bucket está marcado como **público**
2. Verifique se as políticas foram criadas corretamente
3. Confirme que o role "anon" tem permissão

### **❌ Erro: "Upload failed"**
**Solução:**
1. Verifique o tamanho do arquivo (máximo 50MB)
2. Confirme que é uma imagem (JPG, PNG, WebP)
3. Teste com uma imagem menor primeiro

### **❌ Não encontro o Storage**
**Solução:**
1. Procure no menu lateral por "Storage"
2. Pode estar em "Database" > "Storage"
3. Tente atualizar a página (F5)

---

## 📱 Configuração Alternativa (Mais Fácil)

Se estiver com dificuldades, você pode usar o **SQL Editor** do Supabase:

1. **Vá para "SQL Editor"** no menu lateral
2. **Cole este código:**

```sql
-- Criar políticas para o bucket comprovantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true);

-- Política para upload
CREATE POLICY "Permitir upload público" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'comprovantes');

-- Política para visualização
CREATE POLICY "Permitir visualização pública" ON storage.objects
FOR SELECT USING (bucket_id = 'comprovantes');
```

3. **Clique em "Run"**

---

## 🎉 Pronto!

Se seguiu todos os passos, seu bucket "comprovantes" está configurado e pronto para uso!

### **Para confirmar:**
- ✅ Bucket "comprovantes" criado
- ✅ Marcado como público
- ✅ Políticas de acesso configuradas
- ✅ Teste de upload funcionando

---

## 📞 Precisa de Ajuda?

**Se ainda estiver com dificuldades:**

1. **Tire uma captura de tela** da tela onde está com problema
2. **Anote a mensagem de erro** exata
3. **Verifique se está no projeto correto** do Supabase
4. **Tente fazer logout e login** novamente

**Lembre-se:** O bucket "comprovantes" é essencial para a aplicação funcionar. Sem ele, as imagens dos comprovantes não serão salvas!

---

**🚀 Boa sorte! Em poucos minutos você terá tudo funcionando!**