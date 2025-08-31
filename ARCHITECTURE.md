# 📋 Arquitetura do ND Express - Documentação Técnica

## 🏗️ Visão Geral da Arquitetura

O ND Express foi refatorado para uma arquitetura modular e profissional, seguindo padrões da indústria para máxima escalabilidade e manutenibilidade.

## 📁 Estrutura de Diretórios

```
ND-EXPRESS/
├── 📁 public/                    # Assets estáticos
│   ├── 📁 icons/                # Ícones SVG para PWA
│   │   ├── icon-192.svg         # Ícone 192x192
│   │   └── icon-512.svg         # Ícone 512x512
│   └── manifest.json            # Manifest PWA
├── 📁 src/                      # Código fonte principal
│   ├── 📁 assets/               # Recursos da aplicação
│   │   └── 📁 styles/           # Estilos organizados
│   │       ├── global.css       # Estilos globais + variáveis CSS
│   │       ├── components.css   # Estilos de componentes
│   │       └── legacy.css       # Estilos antigos (backup)
│   ├── 📁 components/           # Componentes UI reutilizáveis
│   │   ├── 📁 Header/           # Cabeçalho da aplicação
│   │   │   └── Header.js        # Componente do cabeçalho
│   │   ├── 📁 LoadingOverlay/   # Estados de carregamento
│   │   │   └── LoadingOverlay.js # Overlay de loading
│   │   └── 📁 common/           # Componentes base
│   │       ├── Button.js        # Componente de botão
│   │       └── Input.js         # Componente de input
│   ├── 📁 config/               # Configurações
│   │   └── apiClient.js         # Cliente API centralizado
│   ├── 📁 services/             # Camada de negócio
│   │   ├── ndService.js         # Operações de ND
│   │   ├── launchService.js     # Operações de lançamentos
│   │   ├── storageService.js    # Upload/storage de arquivos
│   │   ├── reportService.js     # Geração de relatórios Excel
│   │   └── downloadService.js   # Download de comprovantes ZIP
│   ├── 📁 utils/                # Funções utilitárias
│   │   ├── constants.js         # Constantes da aplicação
│   │   ├── formatCurrency.js    # Formatação de moeda
│   │   └── formatDate.js        # Formatação de data
│   ├── App.js                   # Componente principal
│   └── index.js                 # Ponto de entrada
├── 📁 api/                      # Endpoints backend seguros
│   ├── openai-analyze.js        # Análise de IA
│   ├── supabase-query.js        # Consultas ao banco
│   ├── supabase-insert.js       # Inserções no banco
│   ├── supabase-update.js       # Atualizações no banco
│   ├── supabase-delete.js       # Exclusões do banco
│   └── supabase-upload.js       # Upload de arquivos
├── 📁 backup/                   # Código legado preservado
│   └── script-legacy.js         # Script original (backup)
├── index.html                   # Página principal
├── config.js                    # Configurações públicas
├── sw.js                        # Service Worker PWA
└── package.json                 # Dependências e scripts
```

## 🔧 Componentes da Arquitetura

### 🎨 **Camada de Apresentação (UI Components)**

#### **Header Component** (`src/components/Header/Header.js`)
- **Responsabilidade**: Exibir informações da ND e resumo financeiro
- **Funcionalidades**:
  - Atualização em tempo real de valores
  - Cálculo automático de saldo
  - Design responsivo
  - Indicadores visuais de status

#### **LoadingOverlay Component** (`src/components/LoadingOverlay/LoadingOverlay.js`)
- **Responsabilidade**: Gerenciar estados de carregamento
- **Funcionalidades**:
  - Overlay com spinner
  - Suporte a progresso
  - Mensagens customizáveis
  - Prevenção de interação durante loading

#### **Button Component** (`src/components/common/Button.js`)
- **Responsabilidade**: Botões reutilizáveis padronizados
- **Variações**: primary, secondary, success, error, warning
- **Estados**: normal, disabled, loading
- **Tamanhos**: sm, normal, lg, full-width

#### **Input Component** (`src/components/common/Input.js`)
- **Responsabilidade**: Inputs de formulário com validação
- **Tipos**: text, email, password, number, date, select
- **Recursos**: validação em tempo real, mensagens de erro, labels

### 🛠️ **Camada de Serviços (Business Logic)**

#### **ndService** (`src/services/ndService.js`)
- **Responsabilidade**: Gerenciamento de Notas de Despesa
- **Operações**:
  - `fetchOpenND()`: Buscar ND aberta
  - `createND()`: Criar nova ND
  - `finalizeND()`: Fechar ND
  - `updateAdiantamento()`: Atualizar adiantamento
  - `generateNextNDNumber()`: Gerar próximo número

#### **launchService** (`src/services/launchService.js`)
- **Responsabilidade**: CRUD de lançamentos (despesas)
- **Operações**:
  - `addLaunch()`: Adicionar despesa
  - `getLaunchesByND()`: Buscar despesas por ND
  - `deleteLaunch()`: Excluir despesa
  - `calculateNDTotal()`: Calcular total
  - `validateLaunchData()`: Validar dados

#### **storageService** (`src/services/storageService.js`)
- **Responsabilidade**: Upload e gerenciamento de imagens
- **Operações**:
  - `uploadImage()`: Upload para Supabase Storage
  - `validateFile()`: Validar arquivo
  - `fileToBase64()`: Conversão para base64
  - `resizeImage()`: Redimensionar imagem
  - `createPreviewUrl()`: Criar preview

#### **reportService** (`src/services/reportService.js`)
- **Responsabilidade**: Geração de relatórios Excel
- **Operações**:
  - `generateExcelFile()`: Gerar arquivo Excel
  - `generateCSVFile()`: Gerar arquivo CSV
  - `addHeader()`: Adicionar cabeçalho
  - `addExpensesData()`: Adicionar dados
  - `addFinancialSummary()`: Adicionar resumo

#### **downloadService** (`src/services/downloadService.js`) 🆕
- **Responsabilidade**: Download de comprovantes em ZIP
- **Operações**:
  - `downloadAllReceipts()`: Baixar todos os comprovantes
  - `checkAvailableReceipts()`: Verificar disponibilidade
  - `estimateDownloadSize()`: Estimar tamanho
  - `generateIndexFile()`: Gerar arquivo de índice
  - `loadJSZip()`: Carregar biblioteca dinamicamente

### ⚙️ **Camada de Configuração**

#### **apiClient** (`src/config/apiClient.js`)
- **Responsabilidade**: Cliente HTTP centralizado
- **Métodos**:
  - `query()`: Consultas ao banco
  - `insert()`: Inserções
  - `update()`: Atualizações
  - `delete()`: Exclusões
  - `upload()`: Upload de arquivos
  - `analyzeImage()`: Análise de IA

### 🔧 **Camada de Utilitários**

#### **constants.js** (`src/utils/constants.js`)
- Categorias de despesas
- Limites por categoria
- Configurações de arquivo
- Tipos de notificação
- Palavras-chave para categorização

#### **formatCurrency.js** (`src/utils/formatCurrency.js`)
- `formatCurrency()`: Formatar para R$ 0,00
- `parseCurrency()`: Converter string para número
- `formatCurrencyInput()`: Formatar para input

#### **formatDate.js** (`src/utils/formatDate.js`)
- `formatDate()`: Formatar para dd/mm/aaaa
- `formatDateForInput()`: Formatar para yyyy-mm-dd
- `parseDate()`: Converter string para Date
- `getCurrentDateForInput()`: Data atual para input

## 🔄 **Fluxo de Dados**

### **1. Inicialização da Aplicação**
```
index.js → App.js → loadInitialData() → ndService.fetchOpenND()
```

### **2. Adição de Despesa**
```
App.handleConfirmExpense() → 
storageService.uploadImage() → 
launchService.addLaunch() → 
App.updateInterface()
```

### **3. Download de Comprovantes** 🆕
```
App.handleDownloadReceipts() → 
downloadService.checkAvailableReceipts() → 
downloadService.downloadAllReceipts() → 
JSZip.generateAsync()
```

### **4. Exportação de ND**
```
App.handleExportND() → 
ndService.finalizeND() → 
reportService.generateExcelFile() → 
App.prepareNewND()
```

## 🎨 **Sistema de Estilos**

### **Variáveis CSS Globais** (`global.css`)
```css
:root {
  /* Cores principais */
  --primary-color: #2563eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  
  /* Espaçamentos */
  --spacing-1: 0.25rem;
  --spacing-4: 1rem;
  
  /* Tipografia */
  --font-family: 'Inter', sans-serif;
  --font-size-base: 1rem;
}
```

### **Componentes Reutilizáveis** (`components.css`)
- `.btn` - Sistema de botões
- `.input` - Inputs padronizados
- `.card` - Cards de conteúdo
- `.notification` - Notificações
- `.loading-overlay` - Overlays de loading

## 🔒 **Segurança e Boas Práticas**

### **Separação de Responsabilidades**
- **Frontend**: Apenas UI e experiência do usuário
- **Backend**: APIs seguras com validação
- **Serviços**: Lógica de negócio isolada
- **Utilitários**: Funções puras reutilizáveis

### **Validação de Dados**
- Validação no frontend (UX)
- Validação no backend (segurança)
- Sanitização de inputs
- Tratamento de erros robusto

### **Performance**
- Carregamento lazy de bibliotecas
- Otimização de imagens
- Caching inteligente
- Minimização de re-renders

## 📱 **PWA Features**

### **Service Worker** (`sw.js`)
- Cache de recursos estáticos
- Funcionamento offline
- Atualizações automáticas

### **Manifest** (`public/manifest.json`)
- Instalação como app nativo
- Ícones otimizados
- Configurações de display

## 🚀 **Deploy e Build**

### **Scripts Disponíveis**
```json
{
  "dev": "python -m http.server 8000",
  "build": "node build-config.js",
  "test": "node -c config.js",
  "lint": "echo 'Linting JavaScript files'"
}
```

### **Vercel Configuration** (`vercel.json`)
- Roteamento de APIs
- Configurações de build
- Variáveis de ambiente

## 🔧 **Extensibilidade**

### **Adicionando Novos Componentes**
1. Criar arquivo em `src/components/`
2. Seguir padrão de classe ES6
3. Implementar métodos `create()`, `render()`, `destroy()`
4. Adicionar estilos em `components.css`

### **Adicionando Novos Serviços**
1. Criar arquivo em `src/services/`
2. Implementar como classe singleton
3. Usar `apiClient` para comunicação
4. Adicionar tratamento de erros

### **Adicionando Novas Utilidades**
1. Criar arquivo em `src/utils/`
2. Implementar como funções puras
3. Adicionar testes unitários
4. Documentar parâmetros e retornos

## 📊 **Métricas e Monitoramento**

### **Logs de Console**
- Inicialização da aplicação
- Operações de CRUD
- Erros e warnings
- Performance de uploads

### **Tratamento de Erros**
- Try-catch em operações assíncronas
- Notificações user-friendly
- Logs detalhados para debug
- Fallbacks para operações críticas

## 🎯 **Próximos Passos Recomendados**

1. **Testes Automatizados**
   - Jest para testes unitários
   - Cypress para testes E2E
   - Coverage reports

2. **TypeScript Migration**
   - Migração gradual
   - Type safety
   - Melhor IntelliSense

3. **Estado Global**
   - Redux ou Context API
   - Estado persistente
   - Time travel debugging

4. **Autenticação**
   - Sistema de login
   - Controle de acesso
   - Sessões seguras

5. **Offline Support**
   - Service Worker avançado
   - Sincronização automática
   - Cache inteligente

---

**📝 Nota**: Esta documentação deve ser atualizada sempre que houver mudanças significativas na arquitetura ou adição de novos componentes/serviços.

**🔄 Última atualização**: 31/08/2025 - Versão 2.0.0