# 🔐 Sistema de Autenticação - ND Express

## 📋 Visão Geral

O ND Express agora possui um sistema completo de autenticação com registro, login e controle de acesso. Todos os usuários precisam estar autenticados e ativos para usar o sistema.

## 🗄️ Estrutura do Banco de Dados

### Tabela `usuarios`
```sql
- id (UUID, PK)
- nome (VARCHAR, NOT NULL)
- email (VARCHAR, UNIQUE, NOT NULL)
- cpf (VARCHAR, UNIQUE, NOT NULL)
- senha_hash (VARCHAR, NOT NULL)
- ativo (BOOLEAN, DEFAULT FALSE) -- ⚠️ CAMPO PARA ATIVAÇÃO MANUAL
- data_criacao (TIMESTAMP)
- data_atualizacao (TIMESTAMP)
- ultimo_login (TIMESTAMP)
- tentativas_login (INTEGER)
- bloqueado_ate (TIMESTAMP)
```

### Tabela `sessoes`
```sql
- id (UUID, PK)
- usuario_id (UUID, FK)
- token_hash (VARCHAR)
- ip_address (INET)
- user_agent (TEXT)
- data_criacao (TIMESTAMP)
- data_expiracao (TIMESTAMP)
- ativo (BOOLEAN)
```

## 🚀 Como Configurar

### 1. Executar Script SQL
```bash
# Execute o arquivo auth-setup.sql no seu banco Supabase
# Isso criará todas as tabelas e configurações necessárias
```

### 2. Configurar Variáveis de Ambiente
```env
# .env
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_supabase
```

### 3. Instalar Dependências
```bash
npm install bcrypt jsonwebtoken
```

## 👤 Fluxo de Usuário

### 1. **Registro de Usuário**
- Usuário acessa a aplicação
- Se não estiver logado, vê tela de login/registro
- Preenche: Nome, Email, CPF, Senha
- Conta é criada como **INATIVA**
- Aguarda ativação manual pelo administrador

### 2. **Ativação Manual (Administrador)**
```sql
-- Ativar usuário via SQL
UPDATE usuarios 
SET ativo = TRUE 
WHERE email = 'usuario@exemplo.com';

-- Listar usuários pendentes
SELECT nome, email, cpf, data_criacao 
FROM usuarios 
WHERE ativo = FALSE 
ORDER BY data_criacao DESC;
```

### 3. **Login**
- Usuário insere email e senha
- Sistema verifica se está ativo
- Gera token JWT válido por 24 horas
- Redireciona para aplicação principal

### 4. **Uso da Aplicação**
- Todas as APIs requerem autenticação
- Token é enviado automaticamente
- Verificação automática a cada 5 minutos
- Logout automático se token inválido

## 🔒 Recursos de Segurança

### **Rate Limiting**
- Registro: 5 tentativas/minuto
- Login: 10 tentativas/minuto
- APIs: 10-30 requests/minuto

### **Proteção contra Ataques**
- Senhas criptografadas com bcrypt (12 rounds)
- Bloqueio após 5 tentativas de login
- Tokens JWT com expiração
- Validação de CPF e email
- Sanitização de dados

### **Controle de Sessão**
- Múltiplas sessões por usuário
- Invalidação automática de tokens expirados
- Logout em todos os dispositivos
- Rastreamento de IP e User-Agent

## 🛠️ APIs de Autenticação

### **POST /auth/register**
```javascript
// Registrar novo usuário
fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    cpf: '123.456.789-00',
    senha: 'minhasenha123'
  })
});
```

### **POST /auth/login**
```javascript
// Fazer login
fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'joao@exemplo.com',
    senha: 'minhasenha123'
  })
});
```

### **POST /auth/verify**
```javascript
// Verificar token
fetch('/auth/verify', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer seu_token_jwt'
  }
});
```

### **POST /auth/logout**
```javascript
// Fazer logout
fetch('/auth/logout', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer seu_token_jwt'
  }
});
```

## 🎨 Interface de Usuário

### **Tela de Login/Registro**
- Design moderno e responsivo
- Alternância entre login e registro
- Validação em tempo real
- Máscaras para CPF
- Toggle de senha
- Mensagens de erro claras

### **Header com Usuário**
- Avatar com inicial do nome
- Nome e email do usuário
- Botão de logout
- Informações da ND
- Totais financeiros

## 🔧 Administração

### **Ativar Usuários**
```sql
-- Ver usuários pendentes
SELECT 
  nome,
  email,
  cpf,
  data_criacao,
  ativo
FROM usuarios 
WHERE ativo = FALSE
ORDER BY data_criacao DESC;

-- Ativar usuário específico
UPDATE usuarios 
SET ativo = TRUE 
WHERE email = 'usuario@exemplo.com';

-- Desativar usuário
UPDATE usuarios 
SET ativo = FALSE 
WHERE email = 'usuario@exemplo.com';
```

### **Gerenciar Sessões**
```sql
-- Ver sessões ativas
SELECT 
  u.nome,
  u.email,
  s.ip_address,
  s.data_criacao,
  s.data_expiracao
FROM sessoes s
JOIN usuarios u ON s.usuario_id = u.id
WHERE s.ativo = TRUE
ORDER BY s.data_criacao DESC;

-- Invalidar todas as sessões de um usuário
UPDATE sessoes 
SET ativo = FALSE 
WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'usuario@exemplo.com');
```

### **Estatísticas**
```sql
-- Usuários por status
SELECT 
  ativo,
  COUNT(*) as total
FROM usuarios 
GROUP BY ativo;

-- Logins por dia (últimos 7 dias)
SELECT 
  DATE(data_criacao) as dia,
  COUNT(*) as logins
FROM sessoes 
WHERE data_criacao >= NOW() - INTERVAL '7 days'
GROUP BY DATE(data_criacao)
ORDER BY dia DESC;
```

## 🚨 Solução de Problemas

### **Usuário não consegue fazer login**
1. Verificar se está ativo: `SELECT ativo FROM usuarios WHERE email = '...'`
2. Verificar tentativas de login: `SELECT tentativas_login, bloqueado_ate FROM usuarios WHERE email = '...'`
3. Resetar tentativas: `UPDATE usuarios SET tentativas_login = 0, bloqueado_ate = NULL WHERE email = '...'`

### **Token inválido**
1. Verificar expiração: Token JWT expira em 24 horas
2. Verificar sessão: `SELECT * FROM sessoes WHERE token_hash = '...'`
3. Limpar sessões expiradas: `DELETE FROM sessoes WHERE data_expiracao < NOW()`

### **Erro de permissão**
1. Verificar RLS (Row Level Security) no Supabase
2. Verificar se usuário tem permissões adequadas
3. Verificar configuração do JWT_SECRET

## 📱 Recursos Mobile

- Interface responsiva
- Touch-friendly
- Validação em tempo real
- Feedback visual
- Suporte a PWA

## 🔮 Próximas Melhorias

- [ ] Recuperação de senha por email
- [ ] Autenticação de dois fatores (2FA)
- [ ] Login social (Google, Microsoft)
- [ ] Auditoria de ações do usuário
- [ ] Dashboard administrativo
- [ ] Notificações push
- [ ] Modo offline

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do servidor
2. Consultar documentação da API
3. Verificar configurações do banco
4. Testar em ambiente de desenvolvimento

---

**✅ Sistema de autenticação implementado com sucesso!**

- 🔐 Login/registro funcionais
- 🛡️ Segurança robusta
- 👤 Controle de usuários
- 🎨 Interface moderna
- 📊 Monitoramento completo