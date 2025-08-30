# 🔧 Configuração de Variáveis de Ambiente no Vercel

## 🚨 Problema Identificado

O site **ND Express** funciona perfeitamente em `localhost:8000` mas não funciona no Vercel (`https://nd-express-ten.vercel.app/`) porque:

1. **Variáveis de ambiente não configuradas** no Vercel
2. **Chaves da API** não estão disponíveis em produção
3. **Frontend não consegue acessar** OpenAI e Supabase

## 📋 Variáveis Necessárias

Baseado no arquivo `config.js`, estas variáveis são obrigatórias:

```javascript
// config.js - Como está configurado
const OPENAI_CONFIG = {
    API_KEY: process.env.OPENAI_API_KEY || 'sua-chave-openai-aqui',
    // ...
};

const SUPABASE_CONFIG = {
    URL: process.env.SUPABASE_URL || 'sua-url-supabase-aqui',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || 'sua-chave-supabase-aqui'
};
```

## ⚠️ PROBLEMA CRÍTICO: Frontend vs Backend

**IMPORTANTE**: O código atual está tentando usar `process.env` no frontend (browser), mas isso **NÃO FUNCIONA** em aplicações estáticas!

### Por que não funciona:
- `process.env` é uma variável do Node.js (servidor)
- No browser, `process.env` é `undefined`
- Vercel serve arquivos estáticos, não executa Node.js no frontend

## 🔧 Soluções Implementáveis

### Solução 1: Configuração Manual no Frontend (Rápida)

**Editar `config.js` com valores reais:**

```javascript
// config.js - Versão para produção
const OPENAI_CONFIG = {
    API_KEY: 'sk-proj-SUA_CHAVE_REAL_AQUI',
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4o',
    MAX_TOKENS: 500
};

const SUPABASE_CONFIG = {
    URL: 'https://SEU_PROJETO.supabase.co',
    ANON_KEY: 'SUA_CHAVE_ANONIMA_REAL_AQUI'
};
```

**⚠️ ATENÇÃO**: Esta solução expõe as chaves no código fonte!

### Solução 2: Build-time Environment Variables (Recomendada)

**1. Criar script de build que injeta variáveis:**

```javascript
// build-config.js
const fs = require('fs');

const config = `
const OPENAI_CONFIG = {
    API_KEY: '${process.env.OPENAI_API_KEY}',
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4o',
    MAX_TOKENS: 500
};

const SUPABASE_CONFIG = {
    URL: '${process.env.SUPABASE_URL}',
    ANON_KEY: '${process.env.SUPABASE_ANON_KEY}'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OPENAI_CONFIG;
} else {
    window.OPENAI_CONFIG = OPENAI_CONFIG;
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
`;

fs.writeFileSync('config.js', config);
console.log('✅ Config gerado com variáveis de ambiente');
```

**2. Atualizar `package.json`:**

```json
{
  "scripts": {
    "build": "node build-config.js",
    "start": "python -m http.server 8000"
  }
}
```

**3. Atualizar `vercel.json`:**

```json
{
  "version": 2,
  "name": "nd-express",
  "buildCommand": "npm run build",
  "builds": [
    {
      "src": "**/*",
      "use": "@vercel/static"
    }
  ]
}
```

### Solução 3: Serverless Functions (Mais Segura)

**Criar API endpoints no Vercel para proteger chaves:**

```javascript
// api/openai.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'API Error' });
    }
}
```

## 🚀 Implementação Imediata (Solução 1)

### Passo 1: Configurar Variáveis no Vercel

1. **Acesse o Vercel Dashboard**:
   - Vá para [vercel.com](https://vercel.com)
   - Selecione o projeto `nd-express`

2. **Configurar Environment Variables**:
   - Vá em **Settings** → **Environment Variables**
   - Adicione as seguintes variáveis:

   ```
   OPENAI_API_KEY = sk-proj-SUA_CHAVE_OPENAI_AQUI
   SUPABASE_URL = https://SEU_PROJETO.supabase.co
   SUPABASE_ANON_KEY = SUA_CHAVE_ANONIMA_SUPABASE
   ```

   - Marque **Production**, **Preview** e **Development**

### Passo 2: Atualizar config.js (Temporário)

**Para funcionar imediatamente, substitua o `config.js` por:**

```javascript
// config.js - Versão temporária para produção
const OPENAI_CONFIG = {
    API_KEY: 'SUA_CHAVE_OPENAI_REAL_AQUI',
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4o',
    MAX_TOKENS: 500
};

const SUPABASE_CONFIG = {
    URL: 'https://SEU_PROJETO_REAL.supabase.co',
    ANON_KEY: 'SUA_CHAVE_ANONIMA_REAL_AQUI'
};

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OPENAI_CONFIG;
} else {
    window.OPENAI_CONFIG = OPENAI_CONFIG;
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
```

### Passo 3: Commit e Deploy

```bash
# Fazer commit das mudanças
git add config.js
git commit -m "fix: add production API keys for Vercel deployment"
git push origin main
```

### Passo 4: Verificar Deploy

1. **Aguardar deploy automático** no Vercel
2. **Testar funcionalidades**:
   - Acesse `https://nd-express-ten.vercel.app/`
   - Teste o botão "Capturar"
   - Verifique se carrega ND do banco
   - Teste análise de imagem com IA

## 🔒 Considerações de Segurança

### ⚠️ Riscos da Solução Temporária:
- **Chaves expostas** no código fonte
- **Visíveis no GitHub** (público)
- **Acessíveis via DevTools** do browser

### ✅ Mitigações:
1. **Usar chaves com escopo limitado**
2. **Monitorar uso das APIs**
3. **Implementar rate limiting**
4. **Migrar para Solução 3** (serverless) posteriormente

### 🔐 Chaves Supabase:
- **ANON_KEY é segura** para frontend (projetada para isso)
- **Políticas RLS** protegem dados sensíveis
- **Sem risco de exposição** crítica

### 🤖 Chaves OpenAI:
- **Maior risco** se exposta
- **Configurar limites** de uso
- **Monitorar gastos** regularmente

## 📊 Checklist de Verificação

### ✅ Antes do Deploy:
- [ ] Variáveis configuradas no Vercel
- [ ] Chaves válidas e testadas
- [ ] Limites de API configurados
- [ ] Backup das chaves originais

### ✅ Após o Deploy:
- [ ] Site carrega sem erros
- [ ] Botão "Capturar" funciona
- [ ] IA analisa imagens corretamente
- [ ] Dados salvam no Supabase
- [ ] ND carrega do banco

### ✅ Monitoramento:
- [ ] Verificar logs do Vercel
- [ ] Monitorar uso da OpenAI
- [ ] Verificar performance do Supabase
- [ ] Acompanhar erros no console

## 🎯 Próximos Passos

1. **Implementar Solução 1** (imediata)
2. **Testar funcionamento** completo
3. **Planejar migração** para Solução 3
4. **Implementar monitoramento** de APIs
5. **Documentar processo** para futuras atualizações

---

**🚀 Com essas configurações, o ND Express funcionará perfeitamente no Vercel!**