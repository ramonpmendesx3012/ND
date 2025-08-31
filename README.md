# ND Express - Sistema de Gestão de Notas de Despesa

![ND Express](https://img.shields.io/badge/Status-Produção-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Sobre o Projeto

O **ND Express** é um sistema moderno e inteligente para gestão de notas de despesa, desenvolvido com tecnologias de ponta e integração com Inteligência Artificial para automatizar o processamento de comprovantes.

### 🎯 Principais Funcionalidades

- **📸 Análise Automática de Comprovantes**: Utiliza IA para extrair dados automaticamente de imagens
- **💰 Gestão de Adiantamentos**: Controle completo de valores antecipados e saldos
- **📊 Exportação Excel**: Relatórios profissionais em formato .xlsx com hiperlinks funcionais
- **🔄 Persistência em Tempo Real**: Dados salvos automaticamente no banco de dados
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

- Node.js 18+ 
- Conta no Supabase
- Conta no OpenAI
- Conta no Vercel (para deploy)

### Configuração Local

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/nd-express.git
cd nd-express
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` baseado no `.env.example`:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
OPENAI_API_KEY=sua_chave_da_openai
```

4. **Configure o banco de dados**

Execute o script SQL no Supabase:
```bash
# Execute o arquivo supabase-setup.sql no SQL Editor do Supabase
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **nd_viagens**: Armazena as notas de despesa
- **lancamentos**: Registra cada comprovante individual

### Configuração do Storage

- **Bucket**: `comprovantes` (público)
- **Tipos permitidos**: JPG, PNG, WebP
- **Tamanho máximo**: 10MB

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte seu repositório ao Vercel**
2. **Configure as variáveis de ambiente**
3. **Deploy automático a cada push**

### Variáveis de Ambiente Necessárias

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
OPENAI_API_KEY=sk-proj-sua_chave
```

## 📱 Como Usar

### Fluxo Básico

1. **Capturar Comprovante**: Clique em "Capturar" e selecione uma imagem
2. **Análise Automática**: A IA extrai data, valor e descrição
3. **Revisar Dados**: Confirme ou edite as informações
4. **Salvar Lançamento**: Dados são persistidos automaticamente
5. **Exportar ND**: Gere relatório Excel quando finalizar

### Categorias Automáticas

- **Alimentação**: Café da manhã, Almoço, Jantar
- **Deslocamento**: Uber, Táxi, Transporte
- **Hospedagem**: Hotéis, Pousadas
- **Outros**: Demais despesas

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run test         # Executar testes
npm run format       # Formatar código com Prettier
npm run lint         # Verificar qualidade do código
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, abra uma [issue](https://github.com/seu-usuario/nd-express/issues) no GitHub.

---

**Desenvolvido com ❤️ para simplificar a gestão de despesas corporativas**
