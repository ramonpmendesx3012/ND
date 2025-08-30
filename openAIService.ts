export interface ExtractedExpenseData {
  description: string;
  value: number;
  date: string; // Formato YYYY-MM-DD
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sua-chave-openai-aqui';

export const extractExpenseFromImage = async (imageBase64: string): Promise<ExtractedExpenseData> => {
  console.log('🔍 Iniciando extração de dados da imagem...');
  console.log('📏 Tamanho do Base64:', imageBase64.length);
  
  try {
    console.log('🌐 Fazendo requisição para OpenAI...');
    
    const requestBody = {
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente de finanças especialista em extrair informações de comprovantes de despesa. Sua única tarefa é analisar a imagem e retornar os dados em um formato JSON estrito, sem nenhuma palavra ou explicação adicional.'
        },
        {
          role: 'user',
          content: [
                         {
               type: 'text',
               text: 'Analise esta imagem de comprovante e extraia EXATAMENTE os seguintes dados em formato JSON: {"description": "string", "value": number, "date": "YYYY-MM-DD"}. REGRAS: 1) Para descrição: se for Uber/99 use "Deslocamento Uber/Transporte", se for refeição use "Café da Manhã" (antes 10:50), "Almoço" (10:50-15:00), "Jantar" (após 18:00), senão use nome do estabelecimento. 2) Para valor: use o valor total pago (após desconto se houver), apenas números com ponto decimal. 3) Para data: use a data do comprovante no formato YYYY-MM-DD. IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional.'
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
      max_tokens: 1000
    };

    console.log('📤 Payload da requisição:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'DebitNoteApp/1.0'
      },
      body: JSON.stringify(requestBody)
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

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Não foi possível encontrar JSON na resposta:', content);
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
      throw new Error('Formato JSON inválido na resposta da IA');
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

    const result = {
      description: extractedData.description,
      value: parseFloat(extractedData.value),
      date: extractedData.date
    };

    console.log('✅ Dados processados com sucesso:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro detalhado ao extrair dados do comprovante:', error);
    if (error instanceof Error) {
      throw new Error(`Falha ao extrair dados do comprovante: ${error.message}`);
    }
    throw new Error('Falha ao extrair dados do comprovante. Verifique se a imagem é clara e contém as informações necessárias.');
  }
};

// Função auxiliar para converter arquivo para Base64
export const fileToBase64 = (file: File): Promise<string> => {
  console.log('📁 Convertendo arquivo para Base64...');
  console.log('📄 Nome do arquivo:', file.name);
  console.log('📏 Tamanho do arquivo:', file.size, 'bytes');
  console.log('🎨 Tipo do arquivo:', file.type);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
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
};
