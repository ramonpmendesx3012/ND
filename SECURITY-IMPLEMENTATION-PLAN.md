# 🛡️ Plano de Implementação de Segurança - ND Express

## 🚨 Ações Imediatas (24-48 horas)

### 1. **Proteger Chaves de API - CRÍTICO**

#### **Problema:** Chaves OpenAI expostas no frontend
#### **Solução:** Implementar serverless functions no Vercel

**Passo 1: Criar API Proxy Segura**

```javascript
// api/openai-analyze.js
export default async function handler(req, res) {
    // Validar método
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validar entrada
    const { imageBase64, prompt } = req.body;
    if (!imageBase64) {
        return res.status(400).json({ error: 'Image data required' });
    }

    // Rate limiting básico (implementar Redis em produção)
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // TODO: Implementar rate limiting por IP

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'User-Agent': 'NDExpress/1.0'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um assistente especializado em extrair dados de comprovantes fiscais. Retorne apenas JSON válido.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt || 'Extraia: data, valor, descrição em JSON'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            console.error('OpenAI API Error:', response.status);
            return res.status(500).json({ error: 'AI service unavailable' });
        }

        const data = await response.json();
        
        // Sanitizar resposta
        const content = data.choices[0]?.message?.content;
        if (!content) {
            return res.status(500).json({ error: 'Invalid AI response' });
        }

        // Validar e sanitizar JSON
        let extractedData;
        try {
            const cleanContent = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            extractedData = JSON.parse(cleanContent);
            
            // Validar estrutura
            if (!extractedData.description || !extractedData.value || !extractedData.date) {
                throw new Error('Invalid data structure');
            }
            
            // Sanitizar dados
            extractedData.description = extractedData.description.substring(0, 100); // Limitar tamanho
            extractedData.value = parseFloat(extractedData.value) || 0;
            
        } catch (parseError) {
            return res.status(500).json({ error: 'Invalid AI response format' });
        }

        res.status(200).json({
            success: true,
            data: extractedData
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
```

**Passo 2: Atualizar Frontend**

```javascript
// script.js - Nova função segura
async function analyzeImageWithOpenAI(imageBase64) {
    console.log('🔍 Iniciando análise segura da imagem...');
    
    try {
        const response = await fetch('/api/openai-analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageBase64: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
                prompt: 'Analise esta imagem de comprovante e extraia: {"description": "string", "value": number, "date": "YYYY-MM-DD"}'
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Análise falhou');
        }

        return {
            date: result.data.date,
            value: result.data.value,
            description: result.data.description,
            category: mapDescriptionToCategory(result.data.description),
            confidence: 95
        };

    } catch (error) {
        console.error('❌ Erro na análise:', error);
        return {
            date: new Date().toISOString().split('T')[0],
            value: 0,
            description: `Erro: ${error.message}`,
            category: 'outros',
            confidence: 0
        };
    }
}
```

**Passo 3: Remover Chaves do Frontend**

```javascript
// config.js - Versão segura
const OPENAI_CONFIG = {
    API_URL: '/api/openai-analyze', // Usar endpoint local
    MODEL: 'gpt-4o',
    MAX_TOKENS: 500
};

const SUPABASE_CONFIG = {
    URL: process.env.SUPABASE_URL || 'sua-url-supabase-aqui',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || 'sua-chave-supabase-aqui'
};

// Remover completamente OPENAI_API_KEY do frontend
```

### 2. **Implementar Autenticação Básica - CRÍTICO**

#### **Passo 1: Configurar Supabase Auth**

```javascript
// auth.js - Novo arquivo
class AuthManager {
    constructor(supabase) {
        this.supabase = supabase;
        this.currentUser = null;
    }

    async signUp(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            
            this.currentUser = data.user;
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            return null;
        }
    }

    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange(callback);
    }
}

// Inicializar
const authManager = new AuthManager(supabase);
```

#### **Passo 2: Criar Interface de Login**

```html
<!-- login.html - Nova página -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ND Express - Login</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <h1>ND Express</h1>
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha:</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="auth-btn">Entrar</button>
            </form>
            <p class="auth-link">
                Não tem conta? <a href="#" onclick="showRegister()">Registre-se</a>
            </p>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="config.js"></script>
    <script src="auth.js"></script>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = await authManager.signIn(email, password);
            
            if (result.success) {
                window.location.href = 'index.html';
            } else {
                alert('Erro no login: ' + result.error);
            }
        });
    </script>
</body>
</html>
```

#### **Passo 3: Atualizar Políticas do Supabase**

```sql
-- security-policies.sql - Substituir políticas públicas

-- Remover políticas públicas
DROP POLICY IF EXISTS "Permitir acesso público" ON public.nd_viagens;
DROP POLICY IF EXISTS "Permitir acesso público" ON public.lancamentos;

-- Criar políticas baseadas em usuário
CREATE POLICY "Usuários podem ver suas próprias NDs" ON public.nd_viagens
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias NDs" ON public.nd_viagens
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias NDs" ON public.nd_viagens
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios lançamentos" ON public.lancamentos
FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM public.nd_viagens WHERE id = nd_id
));

CREATE POLICY "Usuários podem criar lançamentos em suas NDs" ON public.lancamentos
FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.nd_viagens WHERE id = nd_id
));

-- Adicionar coluna user_id se não existir
ALTER TABLE public.nd_viagens ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
```

### 3. **Melhorar Validação de Upload - ALTO**

```javascript
// file-validator.js - Novo arquivo
class FileValidator {
    static ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    static MAX_SIZE = 10 * 1024 * 1024; // 10MB
    static MAGIC_NUMBERS = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/webp': [0x52, 0x49, 0x46, 0x46]
    };

    static async validateFile(file) {
        const errors = [];

        // Validar tamanho
        if (file.size > this.MAX_SIZE) {
            errors.push('Arquivo muito grande. Máximo 10MB.');
        }

        // Validar tipo MIME
        if (!this.ALLOWED_TYPES.includes(file.type)) {
            errors.push('Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.');
        }

        // Validar extensão
        const extension = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        if (!validExtensions.includes(extension)) {
            errors.push('Extensão de arquivo inválida.');
        }

        // Validar magic numbers
        try {
            const isValidMagic = await this.validateMagicNumbers(file);
            if (!isValidMagic) {
                errors.push('Arquivo corrompido ou tipo inválido.');
            }
        } catch (error) {
            errors.push('Erro ao validar arquivo.');
        }

        // Sanitizar nome do arquivo
        const sanitizedName = this.sanitizeFileName(file.name);

        return {
            isValid: errors.length === 0,
            errors,
            sanitizedName
        };
    }

    static async validateMagicNumbers(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arr = new Uint8Array(e.target.result);
                
                for (const [mimeType, magic] of Object.entries(this.MAGIC_NUMBERS)) {
                    if (file.type === mimeType) {
                        const matches = magic.every((byte, index) => arr[index] === byte);
                        resolve(matches);
                        return;
                    }
                }
                resolve(false);
            };
            reader.readAsArrayBuffer(file.slice(0, 8));
        });
    }

    static sanitizeFileName(fileName) {
        // Remover caracteres perigosos
        return fileName
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/\.{2,}/g, '.')
            .substring(0, 100); // Limitar tamanho
    }
}

// Atualizar handleFileSelect
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validação rigorosa
    const validation = await FileValidator.validateFile(file);
    
    if (!validation.isValid) {
        showNotification(validation.errors.join(' '), 'error');
        event.target.value = ''; // Limpar input
        return;
    }

    // Criar novo arquivo com nome sanitizado
    const sanitizedFile = new File([file], validation.sanitizedName, {
        type: file.type,
        lastModified: file.lastModified
    });

    processImage(sanitizedFile);
}
```

## 🔒 Implementações de Médio Prazo (1-2 semanas)

### 4. **Fortalecer Content Security Policy**

```json
// vercel.json - CSP melhorada
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'nonce-{NONCE}' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
}
```

### 5. **Implementar Rate Limiting**

```javascript
// api/rate-limiter.js
const rateLimits = new Map();

export function rateLimit(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimits.has(identifier)) {
        rateLimits.set(identifier, []);
    }
    
    const requests = rateLimits.get(identifier);
    
    // Remover requests antigas
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
        return false; // Rate limit excedido
    }
    
    validRequests.push(now);
    rateLimits.set(identifier, validRequests);
    
    return true; // Permitido
}
```

### 6. **Implementar Logs de Auditoria**

```javascript
// audit-logger.js
class AuditLogger {
    static async log(action, userId, details = {}) {
        try {
            await supabase
                .from('audit_logs')
                .insert({
                    action,
                    user_id: userId,
                    details: JSON.stringify(details),
                    ip_address: this.getClientIP(),
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
        } catch (error) {
            console.error('Erro ao registrar log de auditoria:', error);
        }
    }

    static getClientIP() {
        // Implementar obtenção de IP do cliente
        return 'unknown';
    }
}

// Usar em ações críticas
AuditLogger.log('expense_created', currentUser.id, { ndId: currentNdId, value: expense.value });
AuditLogger.log('file_uploaded', currentUser.id, { fileName: file.name, size: file.size });
```

## 📊 Checklist de Implementação

### **Fase 1: Crítico (24-48h)**
- [ ] Criar serverless functions para OpenAI
- [ ] Remover chaves do frontend
- [ ] Implementar autenticação básica
- [ ] Atualizar políticas do Supabase
- [ ] Melhorar validação de upload

### **Fase 2: Alto (1 semana)**
- [ ] Fortalecer CSP
- [ ] Implementar rate limiting
- [ ] Adicionar logs de auditoria
- [ ] Melhorar validação de dados
- [ ] Configurar monitoramento básico

### **Fase 3: Médio (2 semanas)**
- [ ] Implementar 2FA
- [ ] Adicionar criptografia de dados
- [ ] Configurar backup seguro
- [ ] Implementar detecção de anomalias
- [ ] Adicionar testes de segurança

### **Fase 4: Baixo (1 mês)**
- [ ] Implementar conformidade LGPD
- [ ] Adicionar políticas de retenção
- [ ] Configurar disaster recovery
- [ ] Implementar pen testing
- [ ] Estabelecer governança

## 🚨 Comandos de Emergência

### **Se chaves foram comprometidas:**
```bash
# 1. Revogar chaves imediatamente
# OpenAI: https://platform.openai.com/api-keys
# Supabase: Project Settings > API

# 2. Gerar novas chaves
# 3. Atualizar variáveis de ambiente no Vercel
# 4. Force redeploy
vercel --prod --force

# 5. Monitorar uso suspeito
# 6. Notificar usuários se necessário
```

### **Em caso de incidente de segurança:**
1. **Isolar** - Desativar funcionalidades afetadas
2. **Investigar** - Analisar logs e identificar escopo
3. **Conter** - Implementar correções temporárias
4. **Corrigir** - Aplicar correções definitivas
5. **Comunicar** - Notificar stakeholders
6. **Documentar** - Registrar lições aprendidas

---

**⚠️ IMPORTANTE:** Não faça deploy em produção até que pelo menos as correções da Fase 1 estejam implementadas.

**📞 Suporte:** Para dúvidas sobre implementação, consulte a documentação de segurança ou entre em contato com a equipe de segurança.