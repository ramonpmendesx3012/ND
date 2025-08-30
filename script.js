// ===== VARIÁVEIS GLOBAIS =====
let expenses = [];
let currentImageData = null; // Armazena a imagem em base64 e o nome do arquivo
let ndCounter = 1;
let currentNdId = null; // ID da ND atual
let valorAdiantamento = 0; // Valor do adiantamento da ND atual

// Configuração da OpenAI API (carregada do config.js)
const OPENAI_API_KEY = OPENAI_CONFIG.API_KEY;
const OPENAI_API_URL = OPENAI_CONFIG.API_URL;

// Inicialização do cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

// Variável para armazenar o arquivo original da imagem
let originalImageFile = null;

// ===== FORMATAÇÃO BRASILEIRA =====
function formatCurrency(value) {
  // Garantir que o valor seja numérico
  const numValue = parseFloat(value) || 0;

  // Formatação brasileira com SEMPRE duas casas decimais
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

// ===== REGRAS DE NEGÓCIO - TETO POR CATEGORIA =====
function applyCategoryLimit(value, description, category = null) {
  console.log('💰 Aplicando regras de teto por categoria...', { value, description, category });

  const numericValue =
    typeof value === 'string' ? parseFloat(value.replace(',', '.')) : parseFloat(value);

  if (isNaN(numericValue)) {
    console.log('❌ Valor inválido, retornando 0');
    return 0;
  }

  const descriptionLower = description.toLowerCase();
  let limitedValue = numericValue;
  let appliedLimit = null;

  // Verificar se é categoria Alimentação (aplicar teto geral)
  if (category === 'Alimentação') {
    console.log('🍽️ Categoria Alimentação detectada - verificando tipo de refeição...');

    // Regra 1: Café da Manhã - Teto de R$ 30,00
    if (
      descriptionLower.includes('café da manhã') ||
      descriptionLower.includes('cafe da manha') ||
      descriptionLower.includes('breakfast') ||
      descriptionLower.includes('café')
    ) {
      if (numericValue > 30.0) {
        limitedValue = 30.0;
        appliedLimit = 'Café da Manhã (R$ 30,00)';
      }
    }
    // Regra 2: Almoço - Teto de R$ 60,00
    else if (
      descriptionLower.includes('almoço') ||
      descriptionLower.includes('almoco') ||
      descriptionLower.includes('lunch') ||
      descriptionLower.includes('almocar')
    ) {
      if (numericValue > 60.0) {
        limitedValue = 60.0;
        appliedLimit = 'Almoço (R$ 60,00)';
      }
    }
    // Regra 3: Jantar - Teto de R$ 60,00
    else if (
      descriptionLower.includes('jantar') ||
      descriptionLower.includes('dinner') ||
      descriptionLower.includes('janta')
    ) {
      if (numericValue > 60.0) {
        limitedValue = 60.0;
        appliedLimit = 'Jantar (R$ 60,00)';
      }
    }
    // Regra 4: Alimentação geral (quando não identifica tipo específico) - Teto de R$ 60,00
    else {
      console.log('🍽️ Alimentação geral (tipo não identificado) - aplicando teto de R$ 60,00');
      if (numericValue > 60.0) {
        limitedValue = 60.0;
        appliedLimit = 'Alimentação Geral (R$ 60,00)';
      }
    }
  }
  // Verificação adicional por palavras-chave (para casos onde categoria não foi definida)
  else {
    // Regra 1: Café da Manhã - Teto de R$ 30,00
    if (descriptionLower.includes('café da manhã') || descriptionLower.includes('cafe da manha')) {
      if (numericValue > 30.0) {
        limitedValue = 30.0;
        appliedLimit = 'Café da Manhã (R$ 30,00)';
      }
    }
    // Regra 2: Almoço - Teto de R$ 60,00
    else if (descriptionLower.includes('almoço') || descriptionLower.includes('almoco')) {
      if (numericValue > 60.0) {
        limitedValue = 60.0;
        appliedLimit = 'Almoço (R$ 60,00)';
      }
    }
    // Regra 3: Jantar - Teto de R$ 60,00
    else if (descriptionLower.includes('jantar')) {
      if (numericValue > 60.0) {
        limitedValue = 60.0;
        appliedLimit = 'Jantar (R$ 60,00)';
      }
    }
  }

  if (appliedLimit) {
    console.log(`🔒 Teto aplicado: ${appliedLimit}`);
    console.log(
      `💵 Valor original: R$ ${numericValue.toFixed(2)} → Valor limitado: R$ ${limitedValue.toFixed(2)}`
    );
  } else {
    console.log('✅ Nenhum teto aplicado - valor mantido');
  }

  return limitedValue;
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00'); // Evitar problemas de timezone
  const months = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];

  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// ===== UTILITÁRIOS =====
// Função para converter arquivo para Base64
function fileToBase64(file) {
  console.log('📁 Convertendo arquivo para Base64...');
  console.log('📄 Nome do arquivo:', file.name);
  console.log('📏 Tamanho do arquivo:', file.size, 'bytes');
  console.log('🎨 Tipo do arquivo:', file.type);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      console.log('📤 Resultado da conversão (primeiros 100 chars):', result.substring(0, 100));

      // Remove o prefixo "data:image/jpeg;base64," ou similar
      const base64 = result.split(',')[1];
      console.log('🔍 Base64 extraído (primeiros 50 chars):', base64.substring(0, 50));
      console.log('📏 Tamanho do Base64:', base64.length);

      resolve(base64);
    };
    reader.onerror = error => {
      console.error('❌ Erro na conversão do arquivo:', error);
      reject(error);
    };
  });
}

// ===== PROCESSAMENTO DE IMAGEM =====
async function processImage(file) {
  // Mostrar overlay de carregamento
  showLoadingOverlay(true);

  // Armazenar o arquivo original para upload posterior
  originalImageFile = file;

  try {
    // Converter arquivo para base64
    const base64Data = await fileToBase64(file);

    // Armazenar dados da imagem
    currentImageData = {
      base64: `data:${file.type};base64,${base64Data}`,
      fileSize: file.size,
    };

    // Analisar imagem com OpenAI
    const aiData = await analyzeImageWithOpenAI(base64Data);
    populateForm(aiData);
    showLoadingOverlay(false);
    showForm(true);
  } catch (error) {
    console.error('❌ Erro no processamento da imagem:', error);
    showLoadingOverlay(false);
    showNotification(
      'Não foi possível analisar o comprovante. Por favor, insira os dados manualmente.',
      'error'
    );

    // Mostrar formulário em branco para preenchimento manual
    populateForm({
      date: new Date().toISOString().split('T')[0],
      value: '',
      description: '',
      category: '',
      confidence: 0,
    });
    showForm(true);
  }
}

async function analyzeImageWithOpenAI(imageBase64) {
  console.log('🔍 Iniciando extração de dados da imagem...');
  console.log('📏 Tamanho do Base64:', imageBase64.length);

  try {
    console.log('🌐 Fazendo requisição para OpenAI...');

    // Remover prefixo data:image se existir
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const requestBody = {
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente de finanças especialista em extrair informações de comprovantes de despesa. Sua única tarefa é analisar a imagem e retornar os dados em um formato JSON estrito, sem nenhuma palavra ou explicação adicional.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analise esta imagem de comprovante e extraia EXATAMENTE os seguintes dados em formato JSON: {"description": "string", "value": number, "date": "YYYY-MM-DD"}. REGRAS: 1) Para descrição: SEMPRE analise o HORÁRIO no comprovante para determinar o tipo de refeição: antes das 10:30 = "Café da Manhã", entre 10:30-15:00 = "Almoço", após 15:00 = "Jantar". Se for McDonald\'s, Burger King, KFC, Subway ou restaurantes similares, use o horário para definir (ex: "Almoço", "Jantar", "Café da Manhã"). Para outros casos: "Uber" (transporte), "Hospedagem" (hotéis), "Outros" (demais). 2) Para valor: use o valor total pago (após desconto se houver), apenas números com ponto decimal. 3) Para data: use a data do comprovante no formato YYYY-MM-DD. IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
    };

    console.log('📤 Fazendo requisição para:', OPENAI_API_URL);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        Accept: 'application/json',
        'User-Agent': 'NDExpressApp/1.0',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', errorText);
      throw new Error(`Erro na API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📄 Resposta completa da API:', JSON.stringify(data, null, 2));

    const content = data.choices[0]?.message?.content;
    console.log('📝 Conteúdo extraído:', content);

    if (!content) {
      throw new Error('Resposta vazia da API');
    }

    // Limpar resposta removendo markdown e caracteres inválidos
    let cleanContent = content.trim();

    // Remover blocos de código markdown mais agressivamente
    cleanContent = cleanContent.replace(/```json\s*/gi, '');
    cleanContent = cleanContent.replace(/```\s*/g, '');
    cleanContent = cleanContent.replace(/^```/gm, '');
    cleanContent = cleanContent.replace(/```$/gm, '');

    // Remover caracteres de backtick que podem sobrar
    cleanContent = cleanContent.replace(/`/g, '');

    // Remover quebras de linha e espaços extras
    cleanContent = cleanContent.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    console.log('🧹 Conteúdo limpo:', cleanContent);

    // Extrair JSON da resposta limpa com regex mais robusta
    let jsonMatch = cleanContent.match(/\{[\s\S]*?\}/);

    // Se não encontrou, tentar extrair apenas o primeiro objeto JSON válido
    if (!jsonMatch) {
      const startIndex = cleanContent.indexOf('{');
      const endIndex = cleanContent.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonMatch = [cleanContent.substring(startIndex, endIndex + 1)];
      }
    }

    if (!jsonMatch) {
      console.error('❌ Não foi possível encontrar JSON na resposta:', cleanContent);
      throw new Error('Formato de resposta inválido - JSON não encontrado');
    }

    console.log('🔍 JSON encontrado:', jsonMatch[0]);

    let extractedData;
    try {
      extractedData = JSON.parse(jsonMatch[0]);
      console.log('📊 Dados extraídos:', extractedData);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      console.error('❌ JSON problemático:', jsonMatch[0]);

      // Tentar limpeza adicional
      try {
        let fallbackJson = jsonMatch[0]
          .replace(/'/g, '"') // Trocar aspas simples por duplas
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Adicionar aspas nas chaves
          .replace(/:\s*([^"\[\{][^,}]*)/g, ': "$1"') // Adicionar aspas nos valores string
          .replace(/": "(\d+\.?\d*)"/g, ': $1'); // Remover aspas de números

        console.log('🔧 Tentando JSON corrigido:', fallbackJson);
        extractedData = JSON.parse(fallbackJson);
        console.log('✅ JSON corrigido com sucesso:', extractedData);
      } catch (fallbackError) {
        console.error('❌ Falha na correção do JSON:', fallbackError);
        throw new Error(`Formato JSON inválido na resposta da IA: ${parseError.message}`);
      }
    }

    // Validar os dados extraídos
    if (!extractedData.description || extractedData.value === undefined || !extractedData.date) {
      console.error('❌ Dados incompletos:', extractedData);
      throw new Error('Dados incompletos extraídos da imagem');
    }

    // Validar formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(extractedData.date)) {
      console.error('❌ Formato de data inválido:', extractedData.date);
      throw new Error('Formato de data inválido (deve ser YYYY-MM-DD)');
    }

    // Validar valor numérico
    if (isNaN(parseFloat(extractedData.value))) {
      console.error('❌ Valor não é numérico:', extractedData.value);
      throw new Error('Valor extraído não é um número válido');
    }

    // Mapear descrição para categoria
    const category = mapDescriptionToCategory(extractedData.description);

    const result = {
      date: extractedData.date,
      value: parseFloat(extractedData.value),
      description: extractedData.description,
      category: category,
      confidence: 95, // Alta confiança para análise real da OpenAI
    };

    console.log('✅ Dados processados com sucesso:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro detalhado ao extrair dados do comprovante:', error);

    // Fallback em caso de erro
    return {
      date: new Date().toISOString().split('T')[0],
      value: 0,
      description: `Erro na análise: ${error.message}`,
      category: 'outros',
      confidence: 0,
    };
  }
}

// ===== MAPEAMENTO DE CATEGORIAS =====
function mapDescriptionToCategory(description) {
  const descriptionLower = description.toLowerCase();

  // Alimentação (refeições em geral)
  if (
    descriptionLower.includes('café da manhã') ||
    descriptionLower.includes('cafe da manha') ||
    descriptionLower.includes('almoço') ||
    descriptionLower.includes('almoco') ||
    descriptionLower.includes('jantar') ||
    descriptionLower.includes('refeição') ||
    descriptionLower.includes('refeicao') ||
    descriptionLower.includes('alimentação') ||
    descriptionLower.includes('alimentacao') ||
    descriptionLower.includes('comida') ||
    descriptionLower.includes('restaurante') ||
    descriptionLower.includes('lanchonete') ||
    // Restaurantes específicos
    descriptionLower.includes('mcdonald') ||
    descriptionLower.includes('mc donald') ||
    descriptionLower.includes('burger king') ||
    descriptionLower.includes('kfc') ||
    descriptionLower.includes('subway') ||
    descriptionLower.includes('pizza') ||
    descriptionLower.includes('lanche') ||
    descriptionLower.includes('fast food') ||
    descriptionLower.includes('food')
  ) {
    return 'Alimentação';
  }

  // Deslocamento
  if (
    descriptionLower.includes('deslocamento') ||
    descriptionLower.includes('uber') ||
    descriptionLower.includes('taxi') ||
    descriptionLower.includes('transporte') ||
    descriptionLower.includes('combustivel') ||
    descriptionLower.includes('gasolina')
  ) {
    return 'Deslocamento';
  }

  // Hospedagem
  if (
    descriptionLower.includes('hospedagem') ||
    descriptionLower.includes('hotel') ||
    descriptionLower.includes('pousada') ||
    descriptionLower.includes('resort')
  ) {
    return 'Hospedagem';
  }

  // Caso padrão
  return 'Outros';
}

// ===== PADRONIZAÇÃO DE DESCRIÇÕES =====
function standardizeDescription(originalDescription, category) {
  console.log('📝 Padronizando descrição...', { originalDescription, category });

  const descriptionLower = originalDescription.toLowerCase();

  // Padronização baseada na categoria
  if (category === 'Alimentação') {
    // Verificar tipo específico de refeição
    if (
      descriptionLower.includes('café da manhã') ||
      descriptionLower.includes('cafe da manha') ||
      descriptionLower.includes('breakfast') ||
      descriptionLower.includes('café')
    ) {
      return 'Café da Manhã';
    } else if (
      descriptionLower.includes('almoço') ||
      descriptionLower.includes('almoco') ||
      descriptionLower.includes('lunch')
    ) {
      return 'Almoço';
    } else if (
      descriptionLower.includes('jantar') ||
      descriptionLower.includes('dinner') ||
      descriptionLower.includes('janta')
    ) {
      return 'Jantar';
    }
    // Alimentação geral - usar "Almoço" como padrão
    else {
      return 'Almoço';
    }
  } else if (category === 'Deslocamento') {
    if (descriptionLower.includes('uber') || descriptionLower.includes('99')) {
      return 'Uber';
    } else {
      return 'Uber'; // Padrão para deslocamento
    }
  } else if (category === 'Hospedagem') {
    if (descriptionLower.includes('água') && descriptionLower.includes('hotel')) {
      return 'Água Hotel';
    } else {
      return 'Hospedagem';
    }
  } else {
    // Categoria "Outros" ou não identificada
    return 'Outros';
  }
}

// ===== PERSISTÊNCIA DE SESSÃO - CARREGAMENTO DE ND ABERTA =====
async function loadExpensesFromSupabase() {
  console.log('🔄 Iniciando carregamento de sessão...');

  try {
    // PASSO 1: Buscar ND com status 'aberta' (apenas uma deve existir)
    console.log('🔍 Buscando ND em aberto no banco de dados...');

    const { data: ndData, error: ndError } = await supabase
      .from('nd_viagens')
      .select('*')
      .eq('status', 'aberta')
      .limit(1)
      .single();

    if (ndError && ndError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw ndError;
    }

    // CENÁRIO A: ND aberta encontrada - Restaurar sessão
    if (ndData) {
      console.log('✅ ND aberta encontrada - Restaurando sessão:', ndData.numero_nd);

      currentNdId = ndData.id;
      const numeroAtual = ndData.numero_nd.replace('ND', '');
      ndCounter = parseInt(numeroAtual) || 1;

      // Carregar descrição da ND na interface
      const travelDescriptionField = document.getElementById('travelDescription');
      if (travelDescriptionField && ndData.descricao) {
        travelDescriptionField.value = ndData.descricao;
        console.log('📝 Descrição da ND carregada:', ndData.descricao);
      }

      // Carregar valor do adiantamento
      valorAdiantamento = parseFloat(ndData.valor_adiantamento) || 0;
      const adiantamentoInput = document.getElementById('valorAdiantamento');
      if (adiantamentoInput) {
        adiantamentoInput.value = valorAdiantamento.toFixed(2);
        console.log('💰 Adiantamento carregado:', formatCurrency(valorAdiantamento));
      }

      // PASSO 2: Carregar lançamentos da ND aberta
      console.log('📋 Carregando lançamentos da ND:', currentNdId);

      const { data: lancamentos, error: lancamentosError } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('nd_id', currentNdId)
        .order('created_at', { ascending: false });

      if (lancamentosError) {
        throw lancamentosError;
      }

      // Converter dados do Supabase para formato local
      expenses = lancamentos.map(item => ({
        id: item.id,
        date: item.data_despesa,
        value: item.valor,
        description: item.descricao,
        category: item.categoria,
        confidence: item.confianca || 0,
        image: { base64: null },
        timestamp: item.created_at,
      }));

      console.log(`📊 ${expenses.length} lançamentos carregados da sessão anterior`);

      // Notificar usuário sobre restauração da sessão
      if (expenses.length > 0) {
        showNotification(
          `Sessão restaurada: ${ndData.numero_nd} com ${expenses.length} lançamentos`,
          'success'
        );
      } else {
        showNotification(`Sessão restaurada: ${ndData.numero_nd} (vazia)`, 'info');
      }
    }
    // CENÁRIO B: Nenhuma ND aberta - Criar nova ND
    else {
      console.log('📝 Nenhuma ND aberta encontrada - Criando nova ND...');

      const novoNumero = `ND${String(ndCounter).padStart(3, '0')}`;

      const { data: novaNd, error: criarError } = await supabase
        .from('nd_viagens')
        .insert([
          {
            numero_nd: novoNumero,
            descricao: 'Nova Nota de Despesa',
            status: 'aberta',
          },
        ])
        .select()
        .single();

      if (criarError) {
        throw criarError;
      }

      currentNdId = novaNd.id;
      expenses = []; // Lista vazia para nova ND

      // Definir descrição padrão na interface
      const travelDescriptionField = document.getElementById('travelDescription');
      if (travelDescriptionField) {
        travelDescriptionField.value = 'Nova Nota de Despesa';
      }

      console.log('✅ Nova ND criada:', novoNumero);
      showNotification(`Nova ND ${novoNumero} iniciada`, 'success');
    }

    // Atualizar interface com dados carregados
    updateNDNumber();
    updateExpensesList();
    updateTotal();

    console.log('🎉 Carregamento de sessão concluído com sucesso');
  } catch (error) {
    console.error('❌ Erro ao carregar sessão:', error);
    showNotification('Erro ao carregar sessão. Verifique sua conexão.', 'error');

    // Fallback: criar ND local em caso de erro
    expenses = [];
    currentNdId = null;
    updateNDNumber();
    updateExpensesList();
    updateTotal();
  }
}

// ===== NOTIFICAÇÕES =====
function showNotification(message, type = 'info') {
  // Remover notificação anterior se existir
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Criar nova notificação
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Estilos da notificação
  const style = document.createElement('style');
  style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .notification-success { background: #10b981; }
        .notification-error { background: #ef4444; }
        .notification-info { background: #3b82f6; }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;

  if (!document.querySelector('style[data-notification]')) {
    style.setAttribute('data-notification', 'true');
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Remover após 4 segundos
  setTimeout(() => {
    if (notification && notification.style) {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification && notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 4000);
}

// ===== INICIALIZAÇÃO =====
async function init() {
  bindEvents();
  setupAdiantamentoField();
  updateNDNumber();

  // Carregar dados do Supabase
  await loadExpensesFromSupabase();
}

// ===== EVENTOS E INTERAÇÕES =====
function bindEvents() {
  // Verificar se os elementos existem antes de adicionar eventos
  const captureBtn = document.getElementById('captureBtn');
  if (captureBtn) {
    captureBtn.addEventListener('click', openCapture);
  }

  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }

  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmExpense);
  }

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelForm);
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportND);
  }

  const expenseValue = document.getElementById('expenseValue');
  if (expenseValue) {
    expenseValue.addEventListener('input', formatValueInput);
  }
}

function openCapture() {
  document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      showNotification('Por favor, selecione apenas arquivos de imagem.', 'error');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Arquivo muito grande. Máximo 10MB.', 'error');
      return;
    }

    processImage(file);
  }
}

function formatValueInput(event) {
  const input = event.target;
  let value = input.value;

  // Remover caracteres não numéricos exceto vírgula e ponto
  value = value.replace(/[^0-9.,]/g, '');

  // Substituir vírgula por ponto para cálculos
  value = value.replace(',', '.');

  // Garantir apenas um ponto decimal
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limitar a 2 casas decimais
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2);
  }

  // Atualizar o campo
  input.value = value;

  // Aplicar regras de teto se houver descrição e categoria
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;
  if (description && value) {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      const limitedValue = applyCategoryLimit(numericValue, description, category);
      if (limitedValue !== numericValue) {
        input.value = limitedValue.toFixed(2);
        showNotification(
          `Valor ajustado para R$ ${limitedValue.toFixed(2)} (limite da categoria)`,
          'info'
        );
      }
    }
  }
}

// ===== FORMULÁRIO =====
function populateForm(data) {
  console.log('📋 Preenchendo formulário com dados da IA:', data);

  // Preencher data
  document.getElementById('expenseDate').value = data.date;

  // Preencher categoria primeiro
  document.getElementById('category').value = data.category;

  // Padronizar e preencher descrição
  const standardizedDescription = standardizeDescription(data.description, data.category);
  document.getElementById('description').value = standardizedDescription;

  console.log(`📝 Descrição padronizada: "${data.description}" → "${standardizedDescription}"`);

  // Aplicar regras de teto baseado na descrição e categoria
  if (data.value && data.description && data.category) {
    const originalValue = parseFloat(data.value);
    const limitedValue = applyCategoryLimit(originalValue, data.description, data.category);

    // Exibir valor limitado na tela (já com teto aplicado)
    document.getElementById('expenseValue').value = limitedValue.toFixed(2);

    // Notificar se houve limitação
    if (originalValue !== limitedValue) {
      console.log(
        `💰 Valor da IA limitado: R$ ${originalValue.toFixed(2)} → R$ ${limitedValue.toFixed(2)}`
      );
      showNotification(
        `Valor ajustado para R$ ${limitedValue.toFixed(2)} (limite da categoria aplicado)`,
        'info'
      );
    } else {
      console.log(`✅ Valor da IA dentro do limite: R$ ${originalValue.toFixed(2)}`);
    }
  } else if (data.value) {
    document.getElementById('expenseValue').value = parseFloat(data.value).toFixed(2);
  }

  // Atualizar nível de confiança
  const confidence = data.confidence || 0;
  document.getElementById('confidence').value = `${confidence}%`;

  // Atualizar barra de progresso
  const progressBar = document.getElementById('confidenceProgress');
  progressBar.style.width = `${confidence}%`;

  // Definir cor baseada no nível de confiança
  if (confidence >= 80) {
    progressBar.style.background = '#10b981'; // Verde
  } else if (confidence >= 60) {
    progressBar.style.background = '#f59e0b'; // Amarelo
  } else {
    progressBar.style.background = '#ef4444'; // Vermelho
  }

  console.log('✅ Formulário preenchido com valor limitado exibido (editável pelo usuário)');
}

function showForm(show) {
  const form = document.getElementById('prelaunchForm');
  if (form && form.style) {
    if (show) {
      form.style.display = 'block';
    } else {
      form.style.display = 'none';
    }
  }
}

async function confirmExpense() {
  console.log('🚀 Iniciando confirmExpense...');

  // Validar campos obrigatórios
  const date = document.getElementById('expenseDate').value;
  const value = parseFloat(document.getElementById('expenseValue').value);
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;
  const confidence = document.getElementById('confidence').value;

  console.log('📋 Dados do formulário:', { date, value, description, category, confidence });

  // Validações
  if (!date) {
    showNotification('Por favor, informe a data da despesa.', 'error');
    return;
  }

  if (!value || value <= 0) {
    showNotification('Por favor, informe um valor válido maior que zero.', 'error');
    return;
  }

  if (!category) {
    showNotification('Por favor, selecione uma categoria.', 'error');
    return;
  }

  // Verificar se há ND atual
  if (!currentNdId) {
    console.error('❌ Erro: currentNdId não definido');
    showNotification('Erro: Nenhuma ND ativa encontrada.', 'error');
    return;
  }

  console.log('✅ Validações passaram. ND ID:', currentNdId);

  try {
    // Mostrar loading
    showLoadingOverlay(true);
    console.log('⏳ Loading overlay ativado');

    let imagemUrl = null;

    // Upload da imagem para Supabase Storage (se houver)
    if (originalImageFile) {
      console.log('📤 Iniciando upload da imagem...', originalImageFile.name);
      try {
        imagemUrl = await uploadImageToSupabase(originalImageFile);
        console.log('✅ Upload da imagem concluído:', imagemUrl);
      } catch (uploadError) {
        console.error('❌ Erro no upload da imagem:', uploadError);
        // Continuar sem imagem em caso de erro no upload
        imagemUrl = 'https://via.placeholder.com/150';
      }
    } else {
      console.log('ℹ️ Nenhuma imagem para upload');
      imagemUrl = 'https://via.placeholder.com/150';
    }

    // Preparar dados para inserção
    const dadosParaInserir = {
      nd_id: currentNdId,
      data_despesa: date,
      valor: value,
      descricao: description || 'Não informado',
      categoria: category,
      estabelecimento: 'Não informado', // Campo obrigatório
      imagem_url: imagemUrl,
      confianca: parseInt(confidence) || 0,
    };

    console.log('📝 Dados preparados para inserção:', dadosParaInserir);

    // Inserir no banco de dados
    console.log('💾 Iniciando inserção no Supabase...');
    const { data: insertData, error: supabaseError } = await supabase
      .from('lancamentos')
      .insert([dadosParaInserir])
      .select();

    console.log('📊 Resposta do Supabase:');
    console.log('  - Data:', insertData);
    console.log('  - Error:', supabaseError);

    // Verificar se houve erro no Supabase
    if (supabaseError) {
      console.error('❌ Erro retornado pelo Supabase:', supabaseError);
      throw new Error(`Erro do Supabase: ${supabaseError.message}`);
    }

    // Verificar se dados foram retornados
    if (!insertData || insertData.length === 0) {
      console.error('❌ Nenhum dado retornado após inserção');
      throw new Error('Nenhum dado retornado após inserção');
    }

    console.log('✅ Inserção no Supabase bem-sucedida:', insertData[0]);

    // Adicionar à lista local
    const newExpense = {
      id: insertData[0].id,
      date: date,
      value: value,
      description: description || 'Não informado',
      category: category,
      confidence: parseInt(confidence) || 0,
      image: { base64: currentImageData?.base64 },
      timestamp: insertData[0].created_at,
    };

    console.log('📋 Adicionando à lista local:', newExpense);
    expenses.push(newExpense);

    // Atualizar interface
    console.log('🔄 Atualizando interface...');
    updateExpensesList();
    updateTotal();

    // Limpar e ocultar formulário
    console.log('🧹 Limpando formulário...');
    clearForm();

    showLoadingOverlay(false);
    console.log('✅ Processo concluído com sucesso!');
    showNotification('Lançamento salvo com sucesso!', 'success');
  } catch (error) {
    console.error('❌ Erro capturado no catch:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Tipo do erro:', typeof error);
    console.error('❌ Mensagem do erro:', error.message);

    showLoadingOverlay(false);

    // Mensagem de erro mais específica
    const errorMessage = error.message || 'Erro desconhecido';
    showNotification(`Erro ao salvar: ${errorMessage}`, 'error');
  }
}

function cancelForm() {
  console.log('🔄 Iniciando cancelamento do lançamento...');

  try {
    // 1. Limpar formulário e redefinir valores padrão (sem usar .reset())
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('expenseValue').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = '';
    document.getElementById('confidence').value = '0%';

    // Resetar barra de progresso de confiança
    const progressBar = document.getElementById('confidenceProgress');
    if (progressBar) {
      progressBar.style.width = '0%';
      progressBar.style.background = '#e5e7eb';
    }

    // 2. Ocultar formulário de pré-lançamento
    showForm(false);

    // 3. Descartar imagem da memória
    currentImageData = null;
    originalImageFile = null;

    // 4. Limpar input de arquivo para permitir nova seleção
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
    }

    // 5. Garantir que overlay de loading está oculto
    showLoadingOverlay(false);

    // 6. Reativar botões principais (garantir que estão habilitados)
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.disabled = false;
    }

    // 7. Garantir que a aplicação volta ao estado inicial
    // Remover qualquer classe de estado ativo
    const prelaunchSection = document.getElementById('prelaunchForm');
    if (prelaunchSection) {
      prelaunchSection.style.display = 'none';
    }

    // Notificar usuário sobre o cancelamento
    showNotification('Lançamento cancelado. Você pode iniciar um novo.', 'info');

    console.log('✅ Reset completo executado - aplicação retornou ao estado inicial');
  } catch (error) {
    console.error('❌ Erro durante cancelamento:', error);
    showNotification('Erro ao cancelar. Tente novamente.', 'error');
  }
}

function clearForm() {
  console.log('🧹 Limpando formulário...');

  // Limpar campos individuais (não usar .reset() pois não é um form)
  document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('expenseValue').value = '';
  document.getElementById('description').value = '';
  document.getElementById('category').value = '';
  document.getElementById('confidence').value = '0%';

  // Resetar barra de progresso de confiança
  const progressBar = document.getElementById('confidenceProgress');
  if (progressBar) {
    progressBar.style.width = '0%';
    progressBar.style.background = '#e5e7eb';
  }

  // Limpar dados da imagem
  currentImageData = null;
  originalImageFile = null;

  // Limpar input de arquivo
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.value = '';
  }

  // Ocultar formulário
  showForm(false);

  console.log('✅ Formulário limpo com sucesso');
}

// ===== SUPABASE STORAGE =====
async function uploadImageToSupabase(file) {
  try {
    // Gerar nome único para o arquivo
    const fileName = `comprovante_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;

    // Upload para o bucket 'comprovantes'
    const { data, error } = await supabase.storage.from('comprovantes').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      throw error;
    }

    // Retornar apenas o nome do arquivo (não a URL completa)
    // A URL pública será gerada quando necessário
    return fileName;
  } catch (error) {
    console.error('Erro no upload da imagem:', error);
    throw new Error('Falha no upload da imagem');
  }
}

// ===== INTERFACE E ATUALIZAÇÕES =====
function showLoadingOverlay(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay && overlay.style) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function updateNDNumber() {
  const ndElement = document.getElementById('ndNumber');
  if (ndElement) {
    ndElement.textContent = `ND ${ndCounter.toString().padStart(3, '0')}`;
  }
}

function updateTotal() {
  const total = expenses.reduce((sum, expense) => sum + expense.value, 0);
  const totalElement = document.getElementById('totalValue');
  if (totalElement) {
    totalElement.textContent = formatCurrency(total);
  }

  // Atualizar também os totalizadores
  updateTotalizadores();
}

// ===== GESTÃO DE ADIANTAMENTO E TOTALIZADORES =====
function updateTotalizadores() {
  const totalDespesas = expenses.reduce((sum, expense) => sum + expense.value, 0);

  // FÓRMULA CORRETA: Saldo = Despesas - Adiantamento (valor a receber/devolver)
  const saldoFinal = totalDespesas - valorAdiantamento;

  console.log('📊 Cálculo do saldo:', {
    adiantamento: valorAdiantamento,
    despesas: totalDespesas,
    saldo: saldoFinal,
  });

  // Atualizar displays
  const adiantamentoDisplay = document.getElementById('adiantamentoDisplay');
  const saldoFinalDisplay = document.getElementById('saldoFinal');

  if (adiantamentoDisplay) {
    adiantamentoDisplay.textContent = formatCurrency(valorAdiantamento);
  }

  if (saldoFinalDisplay) {
    // Limpar classes anteriores
    saldoFinalDisplay.className = 'totalizador-value saldo-value';

    // Aplicar regras de cores melhoradas
    if (saldoFinal > 0) {
      // CENÁRIO A: Saldo Positivo = SOBRANDO (VERDE)
      // Usuário gastou menos que o adiantamento, está sobrando dinheiro
      saldoFinalDisplay.classList.add('saldo-sobrando');
      saldoFinalDisplay.textContent = formatCurrency(saldoFinal);
      console.log('🟢 Dinheiro sobrando:', formatCurrency(saldoFinal));
    } else if (saldoFinal < 0) {
      // CENÁRIO B: Saldo Negativo = FALTANDO (VERMELHO)
      // Usuário gastou mais que o adiantamento, está faltando dinheiro
      // Exibir valor negativo com sinal (-)
      saldoFinalDisplay.classList.add('saldo-faltando');
      saldoFinalDisplay.textContent = formatCurrency(saldoFinal); // Mantém o sinal negativo
      console.log('🔴 Dinheiro faltando:', formatCurrency(saldoFinal));
    } else {
      // CENÁRIO C: Saldo Zero = EQUILIBRADO (NEUTRO)
      saldoFinalDisplay.classList.add('saldo-equilibrado');
      saldoFinalDisplay.textContent = formatCurrency(0);
      console.log('⚪ Saldo equilibrado');
    }
  }
}

async function saveAdiantamento(valor) {
  if (!currentNdId) {
    console.warn('Nenhuma ND ativa para salvar adiantamento');
    return;
  }

  try {
    const { error } = await supabase
      .from('nd_viagens')
      .update({ valor_adiantamento: valor })
      .eq('id', currentNdId);

    if (error) {
      throw error;
    }

    valorAdiantamento = valor;
    updateTotalizadores();
    console.log('💰 Adiantamento salvo:', formatCurrency(valor));
  } catch (error) {
    console.error('Erro ao salvar adiantamento:', error);
    showNotification('Erro ao salvar adiantamento', 'error');
  }
}

function setupAdiantamentoField() {
  const adiantamentoInput = document.getElementById('valorAdiantamento');

  if (adiantamentoInput) {
    // Evento onBlur para salvar automaticamente
    adiantamentoInput.addEventListener('blur', async event => {
      const valor = parseFloat(event.target.value) || 0;
      await saveAdiantamento(valor);
    });

    // Formatação em tempo real
    adiantamentoInput.addEventListener('input', event => {
      const valor = parseFloat(event.target.value) || 0;
      valorAdiantamento = valor;
      updateTotalizadores();
    });

    // Definir valor inicial
    adiantamentoInput.value = valorAdiantamento.toFixed(2);
  }
}

// ===== ATUALIZAÇÃO DA GRID DE LANÇAMENTOS =====
function updateExpensesList() {
  console.log('🔄 Atualizando grid de lançamentos...', expenses.length, 'itens');

  const expensesList = document.getElementById('expensesList');

  if (expenses.length === 0) {
    console.log('📋 Nenhum lançamento - mostrando estado vazio');
    expensesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>Nenhum lançamento na ND atual</p>
                <p>Capture um comprovante para começar!</p>
            </div>
        `;
    return;
  }

  console.log('📊 Renderizando', expenses.length, 'lançamentos na grid');

  // Ordenar lançamentos
  const sortedExpenses = sortExpensesByDateAndCategory(expenses);

  // Renderizar grid
  expensesList.innerHTML = '';
  sortedExpenses.forEach(expense => {
    const row = createExpenseGridRow(expense);
    expensesList.appendChild(row);
  });

  console.log('✅ Grid atualizada com sucesso');
}

function createExpenseGridRow(expense) {
  const row = document.createElement('div');
  row.className = 'expense-grid-row';

  const formattedDate = formatDate(expense.date);
  const formattedValue = formatCurrency(expense.value);
  const categoryLabel = getCategoryLabel(expense.category);

  row.innerHTML = `
        <div class="grid-actions">
            <button class="action-btn delete" onclick="deleteExpense('${expense.id}')" title="Excluir lançamento">
                🗑️
            </button>
        </div>
        <div class="grid-date">${formattedDate}</div>
        <div class="grid-category category-${expense.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${categoryLabel}</div>
        <div class="grid-description" onclick="showExpenseDetails('${expense.id}')" style="cursor: pointer;">${expense.description}</div>
        <div class="grid-value">${formattedValue}</div>
        <div class="grid-image">
            <button class="image-btn" onclick="viewExpenseImage('${expense.id}')" title="Ver comprovante">
                📄
            </button>
        </div>
    `;

  return row;
}

// ===== ORDENAÇÃO DE LANÇAMENTOS =====
function sortExpensesByDateAndCategory(expensesList) {
  console.log('🔄 Ordenando lançamentos por data e categoria...');

  // Definir ordem de prioridade das categorias
  const categoryOrder = {
    Alimentação: 1, // Inclui Café da Manhã, Almoço, Jantar
    Deslocamento: 2,
    Hospedagem: 3,
    Outros: 4,
  };

  // Função para determinar sub-ordem dentro de Alimentação
  function getAlimentacaoOrder(description) {
    const desc = description.toLowerCase();
    if (desc.includes('café da manhã') || desc.includes('cafe da manha')) return 1;
    if (desc.includes('almoço') || desc.includes('almoco')) return 2;
    if (desc.includes('jantar')) return 3;
    return 4; // Outras alimentações
  }

  return expensesList.sort((a, b) => {
    // 1. Ordenação primária: por data (mais antiga primeiro)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }

    // 2. Ordenação secundária: por categoria
    const categoryOrderA = categoryOrder[a.category] || 999;
    const categoryOrderB = categoryOrder[b.category] || 999;

    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }

    // 3. Ordenação terciária: dentro de Alimentação, por tipo de refeição
    if (a.category === 'Alimentação' && b.category === 'Alimentação') {
      const subOrderA = getAlimentacaoOrder(a.description);
      const subOrderB = getAlimentacaoOrder(b.description);
      return subOrderA - subOrderB;
    }

    // 4. Ordenação final: por horário de criação
    return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
  });
}

// ===== AÇÕES DA GRID DE LANÇAMENTOS =====

// Função para excluir lançamento
async function deleteExpense(expenseId) {
  console.log('🗑️ Iniciando exclusão do lançamento:', expenseId);

  // Confirmação do usuário
  const confirmDelete = confirm(
    'Tem certeza que deseja excluir este lançamento?\n\nEsta ação não pode ser desfeita.'
  );

  if (!confirmDelete) {
    console.log('❌ Exclusão cancelada pelo usuário');
    return;
  }

  try {
    // Mostrar loading
    showLoadingOverlay(true);

    // Excluir do Supabase
    console.log('💾 Excluindo do banco de dados...');
    const { error } = await supabase.from('lancamentos').delete().eq('id', expenseId);

    if (error) {
      throw error;
    }

    console.log('✅ Lançamento excluído do banco com sucesso');

    // Remover da lista local
    const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
    if (expenseIndex !== -1) {
      const removedExpense = expenses.splice(expenseIndex, 1)[0];
      console.log('📋 Lançamento removido da lista local:', removedExpense.description);
    }

    // Atualizar interface
    updateExpensesList();
    updateTotal();

    showLoadingOverlay(false);
    showNotification('Lançamento excluído com sucesso!', 'success');
  } catch (error) {
    console.error('❌ Erro ao excluir lançamento:', error);
    showLoadingOverlay(false);
    showNotification(`Erro ao excluir: ${error.message}`, 'error');
  }
}

// Função para visualizar imagem do comprovante
function viewExpenseImage(expenseId) {
  console.log('👁️ Visualizando imagem do lançamento:', expenseId);

  const expense = expenses.find(exp => exp.id === expenseId);
  if (!expense) {
    showNotification('Lançamento não encontrado.', 'error');
    return;
  }

  // Buscar URL da imagem no Supabase
  if (expense.image?.base64) {
    showImageModal(expense.image.base64, `Comprovante - ${expense.description}`);
  } else {
    // Se não tem base64, tentar buscar pela URL
    showNotification('Imagem não disponível para visualização.', 'info');
  }
}

// ===== DETALHES DO LANÇAMENTO =====
function showExpenseDetails(expenseId) {
  console.log('👁️ Mostrando detalhes do lançamento:', expenseId);

  const expense = expenses.find(exp => exp.id === expenseId);
  if (!expense) {
    showNotification('Lançamento não encontrado.', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'expense-details-modal';
  modal.innerHTML = `
        <div class="modal-overlay" onclick="closeExpenseDetails()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detalhes do Lançamento</h3>
                <button onclick="closeExpenseDetails()" class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div class="detail-row">
                    <span class="detail-label">Data:</span>
                    <span class="detail-value">${formatDate(expense.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Categoria:</span>
                    <span class="detail-value category-${expense.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${expense.category}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Descrição:</span>
                    <span class="detail-value">${expense.description}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Valor:</span>
                    <span class="detail-value expense-value">${formatCurrency(expense.value)}</span>
                </div>
                ${
                  expense.confidence
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Confiança IA:</span>
                    <span class="detail-value">${expense.confidence}%</span>
                </div>
                `
                    : ''
                }
                ${
                  expense.image?.base64
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Comprovante:</span>
                    <div class="detail-image">
                        <img src="${expense.image.base64}" alt="Comprovante" onclick="showImageModal('${expense.image.base64}')" />
                    </div>
                </div>
                `
                    : ''
                }
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  // Adicionar ao window para acesso global
  window.currentExpenseModal = modal;
}

function closeExpenseDetails() {
  if (window.currentExpenseModal) {
    document.body.removeChild(window.currentExpenseModal);
    window.currentExpenseModal = null;
  }
}

function createExpenseRow(expense) {
  const formattedDate = formatDate(expense.date);
  const formattedValue = formatCurrency(expense.value);
  const categoryLabel = getCategoryLabel(expense.category);
  const confidence = expense.confidence || 0;
  const confidenceClass =
    confidence >= 80
      ? 'confidence-high'
      : confidence >= 60
        ? 'confidence-medium'
        : 'confidence-low';

  return `
        <div class="expense-row">
            <div class="expense-date">${formattedDate}</div>
            <div class="expense-category category-${expense.category}">${categoryLabel}</div>
            <div class="expense-description" title="${expense.description}">${expense.description}</div>
            <div class="expense-value">${formattedValue}</div>
            <div class="expense-confidence ${confidenceClass}">${confidence}%</div>
            <div class="expense-image">
                <button class="image-btn" onclick="viewImage('${expense.id}')" title="Ver comprovante">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function getCategoryLabel(category) {
  // As categorias já estão em português, retornar diretamente
  return category || 'Outros';
}

function viewImage(expenseId) {
  const expense = expenses.find(e => e.id == expenseId);
  if (expense && expense.image) {
    showImageModal(expense.image.base64, expense.description.substring(0, 50) + '...');
  }
}

function showImageModal(imageBase64, title) {
  console.log('🖼️ Abrindo visualizador de imagem avançado...');

  // Criar modal fullscreen
  const modal = document.createElement('div');
  modal.className = 'image-viewer-modal';
  modal.innerHTML = `
        <div class="image-viewer-overlay" onclick="closeImageModal()"></div>
        <div class="image-viewer-container">
            <div class="image-viewer-header">
                <h3 class="image-viewer-title">${title || 'Comprovante'}</h3>
                <div class="image-viewer-controls">
                    <button onclick="zoomOut()" class="control-btn" title="Diminuir zoom">🔍-</button>
                    <button onclick="resetZoom()" class="control-btn" title="Zoom original">⚪</button>
                    <button onclick="zoomIn()" class="control-btn" title="Aumentar zoom">🔍+</button>
                    <button onclick="closeImageModal()" class="control-btn close-btn" title="Fechar">✕</button>
                </div>
            </div>
            <div class="image-viewer-content">
                <div class="image-container" id="imageContainer">
                    <img src="${imageBase64}" alt="Comprovante" class="viewer-image" id="viewerImage" />
                </div>
            </div>
            <div class="image-viewer-footer">
                <div class="zoom-info" id="zoomInfo">100%</div>
                <div class="image-instructions">
                    <span class="desktop-instructions">🖱️ Scroll para zoom • Arraste para mover</span>
                    <span class="mobile-instructions">👆 Pinça para zoom • Arraste para mover</span>
                </div>
            </div>
        </div>
    `;

  // Adicionar estilos do modal
  const style = document.createElement('style');
  style.textContent = `
        .image-viewer-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .image-viewer-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(5px);
        }
        .image-viewer-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 0;
        }
        .image-viewer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            backdrop-filter: blur(10px);
        }
        .image-viewer-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        .image-viewer-controls {
            display: flex;
            gap: 8px;
        }
        .control-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 8px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            min-width: 40px;
        }
        .control-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }
        .control-btn.close-btn {
            background: rgba(239, 68, 68, 0.8);
            border-color: rgba(239, 68, 68, 1);
        }
        .control-btn.close-btn:hover {
            background: rgba(239, 68, 68, 1);
        }
        .image-viewer-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }
        .image-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
            overflow: hidden;
        }
        .image-container:active {
            cursor: grabbing;
        }
        .viewer-image {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            transition: transform 0.1s ease;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            pointer-events: none;
        }
        .image-viewer-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 24px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            backdrop-filter: blur(10px);
        }
        .zoom-info {
            font-weight: 600;
            font-size: 14px;
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
        }
        .image-instructions {
            font-size: 12px;
            opacity: 0.8;
        }
        .mobile-instructions {
            display: none;
        }
        @media (max-width: 768px) {
            .desktop-instructions {
                display: none;
            }
            .mobile-instructions {
                display: inline;
            }
            .image-viewer-header {
                padding: 12px 16px;
            }
            .image-viewer-title {
                font-size: 16px;
            }
            .control-btn {
                padding: 6px 10px;
                font-size: 12px;
                min-width: 36px;
            }
            .image-viewer-footer {
                padding: 8px 16px;
            }
        }
    `;

  if (!document.querySelector('style[data-image-viewer]')) {
    style.setAttribute('data-image-viewer', 'true');
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // Inicializar controles de zoom e pan
  initializeImageViewer();

  // Adicionar ao window para acesso global
  window.currentImageModal = modal;
}

function closeImageModal() {
  console.log('❌ Fechando visualizador de imagem...');

  if (window.currentImageModal) {
    // Limpar event listeners
    cleanupImageViewer();

    document.body.removeChild(window.currentImageModal);
    window.currentImageModal = null;

    // Resetar variáveis globais
    window.imageViewerState = null;
  }
}

// ===== CONTROLES DO VISUALIZADOR DE IMAGEM =====

function initializeImageViewer() {
  const image = document.getElementById('viewerImage');
  const container = document.getElementById('imageContainer');

  if (!image || !container) return;

  // Estado do visualizador
  window.imageViewerState = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    minScale: 0.1,
    maxScale: 5,
  };

  // Event listeners para desktop
  container.addEventListener('wheel', handleWheel, { passive: false });
  container.addEventListener('mousedown', handleMouseDown);
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp);

  // Event listeners para mobile (touch)
  container.addEventListener('touchstart', handleTouchStart, { passive: false });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd);

  // Prevenir seleção de texto e drag padrão
  container.addEventListener('selectstart', e => e.preventDefault());
  container.addEventListener('dragstart', e => e.preventDefault());

  // Aplicar transformação inicial
  updateImageTransform();

  console.log('✅ Visualizador de imagem inicializado');
}

function cleanupImageViewer() {
  const container = document.getElementById('imageContainer');
  if (container) {
    // Remover todos os event listeners
    container.removeEventListener('wheel', handleWheel);
    container.removeEventListener('mousedown', handleMouseDown);
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mouseup', handleMouseUp);
    container.removeEventListener('mouseleave', handleMouseUp);
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
  }
}

// Controles de zoom
function zoomIn() {
  if (!window.imageViewerState) return;

  const newScale = Math.min(window.imageViewerState.scale * 1.2, window.imageViewerState.maxScale);
  setZoom(newScale);
}

function zoomOut() {
  if (!window.imageViewerState) return;

  const newScale = Math.max(window.imageViewerState.scale / 1.2, window.imageViewerState.minScale);
  setZoom(newScale);
}

function resetZoom() {
  if (!window.imageViewerState) return;

  window.imageViewerState.scale = 1;
  window.imageViewerState.translateX = 0;
  window.imageViewerState.translateY = 0;
  updateImageTransform();
}

function setZoom(scale) {
  if (!window.imageViewerState) return;

  window.imageViewerState.scale = scale;
  updateImageTransform();
}

// Atualizar transformação da imagem
function updateImageTransform() {
  const image = document.getElementById('viewerImage');
  const zoomInfo = document.getElementById('zoomInfo');

  if (!image || !window.imageViewerState) return;

  const { scale, translateX, translateY } = window.imageViewerState;

  image.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

  if (zoomInfo) {
    zoomInfo.textContent = `${Math.round(scale * 100)}%`;
  }
}

// ===== EVENT HANDLERS =====

// Mouse wheel para zoom
function handleWheel(e) {
  e.preventDefault();

  if (!window.imageViewerState) return;

  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.min(
    Math.max(window.imageViewerState.scale * delta, window.imageViewerState.minScale),
    window.imageViewerState.maxScale
  );

  setZoom(newScale);
}

// Mouse events para pan
function handleMouseDown(e) {
  if (!window.imageViewerState) return;

  window.imageViewerState.isDragging = true;
  window.imageViewerState.lastX = e.clientX;
  window.imageViewerState.lastY = e.clientY;

  document.body.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
  if (!window.imageViewerState || !window.imageViewerState.isDragging) return;

  const deltaX = e.clientX - window.imageViewerState.lastX;
  const deltaY = e.clientY - window.imageViewerState.lastY;

  window.imageViewerState.translateX += deltaX;
  window.imageViewerState.translateY += deltaY;

  window.imageViewerState.lastX = e.clientX;
  window.imageViewerState.lastY = e.clientY;

  updateImageTransform();
}

function handleMouseUp() {
  if (!window.imageViewerState) return;

  window.imageViewerState.isDragging = false;
  document.body.style.cursor = 'default';
}

// Touch events para mobile
let lastTouchDistance = 0;
let lastTouchCenter = { x: 0, y: 0 };

function handleTouchStart(e) {
  e.preventDefault();

  if (!window.imageViewerState) return;

  if (e.touches.length === 1) {
    // Single touch - pan
    window.imageViewerState.isDragging = true;
    window.imageViewerState.lastX = e.touches[0].clientX;
    window.imageViewerState.lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    // Two touches - zoom
    window.imageViewerState.isDragging = false;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    lastTouchDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    lastTouchCenter = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }
}

function handleTouchMove(e) {
  e.preventDefault();

  if (!window.imageViewerState) return;

  if (e.touches.length === 1 && window.imageViewerState.isDragging) {
    // Single touch - pan
    const deltaX = e.touches[0].clientX - window.imageViewerState.lastX;
    const deltaY = e.touches[0].clientY - window.imageViewerState.lastY;

    window.imageViewerState.translateX += deltaX;
    window.imageViewerState.translateY += deltaY;

    window.imageViewerState.lastX = e.touches[0].clientX;
    window.imageViewerState.lastY = e.touches[0].clientY;

    updateImageTransform();
  } else if (e.touches.length === 2) {
    // Two touches - zoom
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    if (lastTouchDistance > 0) {
      const scaleChange = currentDistance / lastTouchDistance;
      const newScale = Math.min(
        Math.max(window.imageViewerState.scale * scaleChange, window.imageViewerState.minScale),
        window.imageViewerState.maxScale
      );

      setZoom(newScale);
    }

    lastTouchDistance = currentDistance;
  }
}

function handleTouchEnd(e) {
  if (!window.imageViewerState) return;

  window.imageViewerState.isDragging = false;
  lastTouchDistance = 0;
}

// ===== EXPORTAÇÃO =====
async function exportND() {
  if (expenses.length === 0) {
    showNotification('Nenhuma despesa para exportar.', 'error');
    return;
  }

  // Confirmação do usuário
  const confirmExport = confirm(
    'Deseja fechar esta ND e exportar os dados?\n\nApós fechar, não será possível adicionar mais lançamentos.'
  );

  if (!confirmExport) {
    return;
  }

  try {
    showLoadingOverlay(true);
    console.log('📤 Iniciando exportação e fechamento da ND...');

    const description = document.getElementById('travelDescription').value || 'Viagem de Negócios';

    // Buscar dados atuais da ND
    const { data: ndAtual, error: ndError } = await supabase
      .from('nd_viagens')
      .select('numero_nd, total_calculado')
      .eq('id', currentNdId)
      .single();

    if (ndError) {
      throw ndError;
    }

    const ndNumber = ndAtual.numero_nd;
    const total = parseFloat(ndAtual.total_calculado) || 0;

    console.log('📊 Dados da ND:', { ndNumber, total, description });

    // Atualizar a ND atual para fechada
    const { error: updateError } = await supabase
      .from('nd_viagens')
      .update({
        descricao: description,
        status: 'fechada',
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentNdId);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ ND fechada no banco de dados');

    // Gerar arquivo Excel (.xlsx)
    await generateExcelFile(expenses, ndNumber, description, total, valorAdiantamento);

    console.log('📁 Arquivo Excel (.xlsx) gerado e baixado');

    showLoadingOverlay(false);
    showNotification(`ND ${ndNumber} fechada e exportada com sucesso!`, 'success');

    // Preparar para nova ND após um delay
    setTimeout(async () => {
      await prepareNewND();
    }, 2000);
  } catch (error) {
    console.error('❌ Erro ao exportar ND:', error);
    showLoadingOverlay(false);
    showNotification(`Erro ao exportar ND: ${error.message}`, 'error');
  }
}

// Função para preparar uma nova ND
async function prepareNewND() {
  console.log('🆕 Preparando nova ND...');

  try {
    // Limpar dados locais
    expenses = [];
    currentImageData = null;
    originalImageFile = null;
    ndCounter++;

    // Criar nova ND no banco
    const novoNumero = `ND${String(ndCounter).padStart(3, '0')}`;
    const { data: novaNd, error } = await supabase
      .from('nd_viagens')
      .insert([
        {
          numero_nd: novoNumero,
          descricao: 'Nova Nota de Despesa',
          status: 'aberta',
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    currentNdId = novaNd[0].id;

    // Limpar interface
    document.getElementById('travelDescription').value = '';
    updateNDNumber();
    updateTotal();
    updateExpensesList();

    // Ocultar formulário se estiver visível
    showForm(false);

    console.log('✅ Nova ND criada:', novoNumero);
    showNotification(`Nova ND ${novoNumero} iniciada!`, 'info');
  } catch (error) {
    console.error('❌ Erro ao criar nova ND:', error);
    showNotification('Erro ao criar nova ND. Recarregue a página.', 'error');
  }
}

// Função para gerar CSV
// ===== GERAÇÃO DE ARQUIVO EXCEL (.XLSX) =====
async function generateExcelFile(expenses, ndNumber, description, total, adiantamento) {
  try {
    console.log('📊 Iniciando geração do arquivo Excel...');

    // Criar nova workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Nota de Despesa');

    // LINHA 1: Cabeçalho da ND
    const headerCell = worksheet.getCell('A1');
    headerCell.value = `ND Nº: ${ndNumber} - ${description}`;
    headerCell.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7F3FF' },
    };

    // Mesclar células para o cabeçalho (A1:E1)
    worksheet.mergeCells('A1:E1');

    // LINHA 2: Cabeçalho das Colunas
    const headers = ['Data', 'Categoria', 'Descrição', 'Valor', 'Link do Comprovante'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(2, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // LINHA 3 EM DIANTE: Dados dos Lançamentos
    let currentRow = 3;

    for (const expense of expenses) {
      // Coluna A: Data
      const dateCell = worksheet.getCell(currentRow, 1);
      dateCell.value = new Date(expense.date);
      dateCell.numFmt = 'dd/mm/yyyy';

      // Coluna B: Categoria
      const categoryCell = worksheet.getCell(currentRow, 2);
      categoryCell.value = expense.category || 'Outros';

      // Coluna C: Descrição
      const descCell = worksheet.getCell(currentRow, 3);
      descCell.value = expense.description || 'Sem descrição';

      // Coluna D: Valor
      const valueCell = worksheet.getCell(currentRow, 4);
      valueCell.value = expense.value;
      valueCell.numFmt = 'R$ #,##0.00';

      // Coluna E: Link do Comprovante
      const linkCell = worksheet.getCell(currentRow, 5);
      if (expense.id) {
        // Buscar URL da imagem no Supabase Storage
        const imageUrl = await getImageUrlFromSupabase(expense.id);
        if (imageUrl) {
          linkCell.value = {
            text: 'Visualizar Comprovante',
            hyperlink: imageUrl,
          };
          linkCell.font = { color: { argb: 'FF0563C1' }, underline: true };
        } else {
          linkCell.value = 'Comprovante não disponível';
        }
      } else {
        linkCell.value = 'Sem comprovante';
      }

      // Aplicar bordas a todas as células da linha
      for (let col = 1; col <= 5; col++) {
        const cell = worksheet.getCell(currentRow, col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      currentRow++;
    }

    // Adicionar linha de totais
    currentRow += 1;

    // Informações de resumo
    const summaryStartRow = currentRow;

    // Valor do Adiantamento
    worksheet.getCell(summaryStartRow, 3).value = 'Valor do Adiantamento:';
    worksheet.getCell(summaryStartRow, 3).font = { bold: true };
    worksheet.getCell(summaryStartRow, 4).value = adiantamento;
    worksheet.getCell(summaryStartRow, 4).numFmt = 'R$ #,##0.00';
    worksheet.getCell(summaryStartRow, 4).font = { bold: true, color: { argb: 'FF0070C0' } };

    // Total de Despesas
    worksheet.getCell(summaryStartRow + 1, 3).value = 'Total de Despesas:';
    worksheet.getCell(summaryStartRow + 1, 3).font = { bold: true };
    worksheet.getCell(summaryStartRow + 1, 4).value = total;
    worksheet.getCell(summaryStartRow + 1, 4).numFmt = 'R$ #,##0.00';
    worksheet.getCell(summaryStartRow + 1, 4).font = { bold: true };

    // Saldo Final
    const saldoFinal = total - adiantamento;
    worksheet.getCell(summaryStartRow + 2, 3).value = 'Saldo Final:';
    worksheet.getCell(summaryStartRow + 2, 3).font = { bold: true };
    worksheet.getCell(summaryStartRow + 2, 4).value = saldoFinal;
    worksheet.getCell(summaryStartRow + 2, 4).numFmt = 'R$ #,##0.00';

    // Cor do saldo baseada no valor
    if (saldoFinal > 0) {
      worksheet.getCell(summaryStartRow + 2, 4).font = { bold: true, color: { argb: 'FF10B981' } }; // Verde
    } else if (saldoFinal < 0) {
      worksheet.getCell(summaryStartRow + 2, 4).font = { bold: true, color: { argb: 'FFEF4444' } }; // Vermelho
    } else {
      worksheet.getCell(summaryStartRow + 2, 4).font = { bold: true, color: { argb: 'FF6B7280' } }; // Cinza
    }

    // Ajustar largura das colunas
    worksheet.getColumn(1).width = 12; // Data
    worksheet.getColumn(2).width = 15; // Categoria
    worksheet.getColumn(3).width = 30; // Descrição
    worksheet.getColumn(4).width = 15; // Valor
    worksheet.getColumn(5).width = 25; // Link do Comprovante

    // Gerar buffer do arquivo
    const buffer = await workbook.xlsx.writeBuffer();

    // Criar blob e fazer download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    // Nome do arquivo dinâmico
    const fileName = `ND-${ndNumber}_${description.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`;
    link.setAttribute('download', fileName);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log('✅ Arquivo Excel gerado com sucesso:', fileName);
  } catch (error) {
    console.error('❌ Erro ao gerar arquivo Excel:', error);
    throw error;
  }
}

// Função auxiliar para buscar URL da imagem no Supabase Storage
async function getImageUrlFromSupabase(expenseId) {
  try {
    // Buscar informações do lançamento
    const { data: lancamento, error } = await supabase
      .from('lancamentos')
      .select('imagem_url')
      .eq('id', expenseId)
      .single();

    if (error || !lancamento?.imagem_url) {
      return null;
    }

    // Gerar URL pública da imagem
    const { data } = supabase.storage.from('comprovantes').getPublicUrl(lancamento.imagem_url);

    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao buscar URL da imagem:', error);
    return null;
  }
}

// ===== INICIALIZAÇÃO =====
// Inicializar aplicação quando a página carregar
window.addEventListener('DOMContentLoaded', init);

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registrado com sucesso:', registration);
      })
      .catch(registrationError => {
        console.log('Falha no registro do SW:', registrationError);
      });
  });
}
