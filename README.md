<<<<<<< HEAD
# ND Express - Sistema de Gestão de Notas de Despesa

![ND Express](https://img.shields.io/badge/Status-Produção-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Sobre o Projeto

O **ND Express** é um sistema moderno e inteligente para gestão de notas de despesa, desenvolvido com tecnologias de ponta e integração com Inteligência Artificial para automatizar o processamento de comprovantes.

### 🎯 Principais Funcionalidades

- **📸 Análise Automática de Comprovantes**: Utiliza OpenAI GPT-4 Vision para extrair dados automaticamente
- **💰 Gestão de Adiantamentos**: Controle completo de valores antecipados e saldos
- **📊 Exportação Excel**: Relatórios profissionais em formato .xlsx com hiperlinks funcionais
- **🔄 Persistência em Tempo Real**: Dados salvos automaticamente no Supabase
- **🎨 Interface Moderna**: Design responsivo e intuitivo
- **📱 PWA Ready**: Funciona como aplicativo móvel

## 🚀 Tecnologias Utilizadas

### Frontend
- **HTML5/CSS3/JavaScript**: Base da aplicação
- **ExcelJS**: Geração de relatórios Excel
- **PWA**: Service Worker para funcionalidade offline

### Backend & Serviços
- **Supabase**: Banco de dados PostgreSQL e Storage
- **OpenAI GPT-4 Vision**: Análise inteligente de imagens
- **Vercel**: Deploy e hospedagem

### Integrações
- **Supabase Storage**: Armazenamento seguro de comprovantes
- **OpenAI API**: Processamento de imagens com IA
- **GitHub Actions**: CI/CD automatizado

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ (para desenvolvimento)
- Conta no Supabase
- Chave da API OpenAI
- Conta no Vercel (para deploy)

### 1. Clone o Repositório

```bash
git clone https://github.com/ramonpmendesx3012/ND.git
cd ND
```

### 2. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# OpenAI Configuration
OPENAI_API_KEY=sua_chave_da_openai
```

### 3. Configuração do Supabase

#### 3.1 Criar Tabelas

Execute o script SQL fornecido:

```sql
-- Execute o arquivo supabase-setup.sql no SQL Editor do Supabase
```

#### 3.2 Configurar Storage

1. Crie um bucket chamado `comprovantes`
2. Configure as políticas de acesso conforme `GUIA-BUCKET-SUPABASE.md`

### 4. Executar Localmente

```bash
# Servidor de desenvolvimento
python -m http.server 8000

# Acesse: http://localhost:8000
```

## 🔧 Configuração para Produção

### Deploy no Vercel

1. **Fork este repositório**
2. **Conecte ao Vercel**:
   - Acesse [vercel.com](https://vercel.com)
   - Importe o repositório
   - Configure as variáveis de ambiente

3. **Variáveis de Ambiente no Vercel**:
   ```
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   OPENAI_API_KEY=sua_chave_da_openai
   ```

4. **Deploy Automático**:
   - Cada push na branch `main` dispara deploy automático
   - GitHub Actions executa testes e validações

## 📖 Como Usar

### 1. Criação de Nova ND

- O sistema cria automaticamente uma nova Nota de Despesa
- Defina o valor do adiantamento
- Adicione uma descrição

### 2. Adição de Despesas

#### Método 1: Upload de Comprovante
1. Clique em "Capturar/Upload"
2. Selecione a imagem do comprovante
3. A IA extrai automaticamente:
   - Data da despesa
   - Valor total
   - Categoria (baseada em horário e estabelecimento)
   - Descrição inteligente

#### Método 2: Entrada Manual
1. Clique em "Adicionar Manualmente"
2. Preencha os campos necessários
3. Confirme a despesa

### 3. Gestão de Saldo

- **Verde**: Dinheiro sobrando (adiantamento > despesas)
- **Vermelho**: Faltando dinheiro (despesas > adiantamento)
- **Cinza**: Valores equilibrados

### 4. Exportação

1. Clique em "Fechar e Exportar ND"
2. Confirme a operação
3. Arquivo Excel será baixado automaticamente
4. Nova ND é criada automaticamente

## 🤖 Inteligência Artificial

### Análise de Comprovantes

O sistema utiliza OpenAI GPT-4 Vision com regras específicas:

#### Categorização por Horário
- **Antes das 10:30**: Café da Manhã
- **10:30 às 15:00**: Almoço
- **Após 15:00**: Jantar

#### Estabelecimentos Reconhecidos
- **McDonald's, Burger King, KFC, Subway**: Categorização por horário
- **Uber, 99**: Transporte
- **Hotéis**: Hospedagem
- **Outros**: Categoria geral

#### Precisão
- **95% de confiança** para análises da OpenAI
- **Validação automática** de formatos
- **Fallback** para entrada manual em caso de erro

## 📊 Estrutura do Banco de Dados

### Tabela: `nd_viagens`
```sql
- id (UUID, PK)
- numero_nd (TEXT)
- descricao (TEXT)
- status (TEXT) -- 'aberta' | 'fechada'
- total_calculado (NUMERIC)
- valor_adiantamento (NUMERIC)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabela: `lancamentos`
```sql
- id (UUID, PK)
- nd_id (UUID, FK)
- data_despesa (DATE)
- valor (NUMERIC)
- descricao (TEXT)
- categoria (TEXT)
- estabelecimento (TEXT)
- imagem_url (TEXT)
- confianca (INTEGER)
- created_at (TIMESTAMP)
```

## 🔒 Segurança

- **Autenticação**: Integração com Supabase Auth
- **Autorização**: Row Level Security (RLS)
- **Storage**: Políticas de acesso granular
- **API Keys**: Variáveis de ambiente seguras
- **HTTPS**: Comunicação criptografada

## 🧪 Testes

### Testes Manuais

1. **Upload de Comprovante**:
   - Teste com diferentes tipos de estabelecimentos
   - Verifique categorização automática
   - Confirme extração de dados

2. **Gestão de Adiantamento**:
   - Teste cálculos de saldo
   - Verifique cores dos indicadores
   - Confirme persistência

3. **Exportação Excel**:
   - Verifique formatação
   - Teste hiperlinks
   - Confirme dados completos

### Arquivos de Teste

- `test-database.html`: Teste de conexão Supabase
- `test-openai.html`: Teste de integração OpenAI
- `test-supabase.html`: Teste completo de funcionalidades

## 📈 Roadmap

### Versão 1.1
- [ ] Autenticação de usuários
- [ ] Múltiplas NDs simultâneas
- [ ] Relatórios avançados
- [ ] Integração com ERP

### Versão 1.2
- [ ] App móvel nativo
- [ ] OCR offline
- [ ] Sincronização offline
- [ ] Dashboard analytics

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Ramon** - [GitHub](https://github.com/ramonpmendesx3012)

## 📞 Suporte

Para suporte e dúvidas:

- 📧 Email: [seu-email@exemplo.com]
- 🐛 Issues: [GitHub Issues](https://github.com/ramonpmendesx3012/ND/issues)
- 📖 Documentação: [Wiki do Projeto](https://github.com/ramonpmendesx3012/ND/wiki)

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela!**

---

*Desenvolvido com ❤️ e ☕ por Ramon*
=======
# ND
Registro de Notas de Débito
>>>>>>> 68088c12d550c36701c4e50260845f1974edd106
