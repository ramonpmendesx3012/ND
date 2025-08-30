# ⚡ Configuração Rápida - Vercel Environment Variables

## 🚨 AÇÃO IMEDIATA NECESSÁRIA

Seu site está online mas **NÃO FUNCIONA** porque as variáveis de ambiente não estão configuradas no Vercel.

## 📋 Passo a Passo (5 minutos)

### 1. Acesse o Vercel Dashboard

1. Vá para [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Clique no projeto **"nd-express"**

### 2. Configure Environment Variables

1. No projeto, clique em **"Settings"** (no menu superior)
2. No menu lateral, clique em **"Environment Variables"**
3. Adicione as seguintes variáveis:

#### Variável 1: OpenAI API Key
```
Name: OPENAI_API_KEY
Value: sk-proj-SUA_CHAVE_OPENAI_AQUI
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variável 2: Supabase URL
```
Name: SUPABASE_URL
Value: https://SEU_PROJETO.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variável 3: Supabase Anonymous Key
```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: ✅ Production ✅ Preview ✅ Development
```

### 3. Onde Encontrar as Chaves

#### 🤖 OpenAI API Key:
1. Acesse [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Clique em **"Create new secret key"**
3. Copie a chave (começa com `sk-proj-`)

#### 🗄️ Supabase Credentials:
1. Acesse [supabase.com](https://supabase.com)
2. Vá no seu projeto
3. Clique em **"Settings"** → **"API"**
4. Copie:
   - **Project URL** (para SUPABASE_URL)
   - **anon public** key (para SUPABASE_ANON_KEY)

### 4. Forçar Novo Deploy

1. No Vercel, vá na aba **"Deployments"**
2. Clique nos **3 pontos (...)** do último deployment
3. Clique em **"Redeploy"**
4. Aguarde o build terminar (1-2 minutos)

### 5. Testar o Site

1. Acesse: `https://nd-express-ten.vercel.app/`
2. Teste o botão **"Capturar"**
3. Verifique se carrega dados do banco
4. Teste upload de imagem

## 🔍 Verificação de Problemas

### Se ainda não funcionar:

1. **Abra o DevTools** (F12)
2. Vá na aba **"Console"**
3. Procure por erros em vermelho
4. Verifique se as chaves estão sendo carregadas:
   ```javascript
   console.log(OPENAI_CONFIG.API_KEY);
   console.log(SUPABASE_CONFIG.URL);
   ```

### Erros Comuns:

❌ **"OPENAI_CONFIG is not defined"**
→ Variáveis não configuradas no Vercel

❌ **"401 Unauthorized"**
→ Chave da OpenAI inválida

❌ **"Failed to fetch"**
→ Chave do Supabase inválida

❌ **"sua-chave-openai-aqui"**
→ Variáveis não foram substituídas

## 🚀 Resultado Esperado

Após configurar corretamente:

✅ Site carrega sem erros
✅ Botão "Capturar" funciona
✅ IA analisa imagens
✅ Dados salvam no banco
✅ ND carrega automaticamente

## 📞 Suporte

Se ainda tiver problemas:

1. **Verifique os logs** no Vercel (aba Functions)
2. **Teste as chaves** individualmente
3. **Compare** com funcionamento local
4. **Reporte** erros específicos do console

---

**⏰ Tempo estimado: 5 minutos**
**🎯 Resultado: Site 100% funcional no Vercel**