// api/openai-analyze.js - Endpoint seguro para análise de imagens
// Este arquivo deve ser colocado na pasta /api/ para funcionar como serverless function no Vercel

export default async function handler(req, res) {
    // Configurar CORS e headers de segurança
    res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL || 'http://localhost:8000');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Tratar preflight OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Validar método HTTP
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    // Validar chave de API
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY não configurada');
        return res.status(500).json({ 
            success: false, 
            error: 'Service configuration error' 
        });
    }

    // Rate limiting básico por IP
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection?.remoteAddress || 
                    'unknown';
    
    // TODO: Implementar rate limiting mais robusto com Redis/Database
    // Por enquanto, apenas log para monitoramento
    console.log(`🔍 Análise solicitada por IP: ${clientIP}`);

    try {
        // Validar entrada
        const { imageBase64, prompt } = req.body;
        
        if (!imageBase64) {
            return res.status(400).json({ 
                success: false, 
                error: 'Image data is required' 
            });
        }

        // Validar tamanho da imagem (base64)
        if (imageBase64.length > 15 * 1024 * 1024) { // ~10MB em base64
            return res.status(400).json({ 
                success: false, 
                error: 'Image too large. Maximum 10MB.' 
            });
        }

        // Validar formato base64
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(imageBase64)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid image format' 
            });
        }

        // Preparar prompt seguro
        const safePrompt = prompt || `
            Analise esta imagem de comprovante fiscal e extraia EXATAMENTE os seguintes dados em formato JSON:
            {"description": "string", "value": number, "date": "YYYY-MM-DD"}
            
            REGRAS:
            1) Para descrição: Analise o HORÁRIO para determinar tipo de refeição:
               - Antes das 10:30 = "Café da Manhã"
               - Entre 10:30-15:00 = "Almoço" 
               - Após 15:00 = "Jantar"
               - Para Uber/99 = "Transporte"
               - Para hotéis = "Hospedagem"
            2) Para valor: use o valor total pago, apenas números
            3) Para data: formato YYYY-MM-DD
            
            IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional.
        `;

        // Fazer requisição para OpenAI
        console.log('📤 Enviando requisição para OpenAI...');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                        content: 'Você é um assistente especializado em extrair dados de comprovantes fiscais. Retorne apenas JSON válido sem explicações.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: safePrompt
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
                max_tokens: 500,
                temperature: 0.1 // Baixa temperatura para respostas mais consistentes
            })
        });

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('❌ Erro da OpenAI API:', openaiResponse.status, errorText);
            
            return res.status(500).json({ 
                success: false, 
                error: 'AI service temporarily unavailable' 
            });
        }

        const openaiData = await openaiResponse.json();
        console.log('📥 Resposta da OpenAI recebida');

        // Extrair conteúdo
        const content = openaiData.choices[0]?.message?.content;
        if (!content) {
            return res.status(500).json({ 
                success: false, 
                error: 'Invalid AI response' 
            });
        }

        // Sanitizar e validar JSON
        let extractedData;
        try {
            // Limpar markdown e caracteres extras
            let cleanContent = content.trim();
            cleanContent = cleanContent.replace(/```json\s*/gi, '');
            cleanContent = cleanContent.replace(/```\s*/g, '');
            cleanContent = cleanContent.replace(/`/g, '');
            cleanContent = cleanContent.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

            // Extrair JSON
            const jsonMatch = cleanContent.match(/\{[\s\S]*?\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            extractedData = JSON.parse(jsonMatch[0]);
            
            // Validar estrutura obrigatória
            if (!extractedData.description || 
                extractedData.value === undefined || 
                !extractedData.date) {
                throw new Error('Missing required fields');
            }

            // Sanitizar e validar dados
            extractedData.description = String(extractedData.description)
                .substring(0, 100) // Limitar tamanho
                .replace(/<[^>]*>/g, '') // Remover HTML
                .replace(/[<>"'&]/g, ''); // Remover caracteres perigosos

            extractedData.value = parseFloat(extractedData.value) || 0;
            if (extractedData.value < 0 || extractedData.value > 999999) {
                extractedData.value = 0; // Valor inválido
            }

            // Validar formato da data
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(extractedData.date)) {
                extractedData.date = new Date().toISOString().split('T')[0];
            }

            // Validar se a data não é muito antiga ou futura
            const extractedDate = new Date(extractedData.date);
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const oneMonthFuture = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            
            if (extractedDate < oneYearAgo || extractedDate > oneMonthFuture) {
                extractedData.date = now.toISOString().split('T')[0];
            }

        } catch (parseError) {
            console.error('❌ Erro ao processar JSON:', parseError);
            return res.status(500).json({ 
                success: false, 
                error: 'Invalid AI response format' 
            });
        }

        // Log para auditoria (sem dados sensíveis)
        console.log('✅ Análise concluída com sucesso', {
            ip: clientIP,
            timestamp: new Date().toISOString(),
            hasDescription: !!extractedData.description,
            hasValue: !!extractedData.value,
            hasDate: !!extractedData.date
        });

        // Retornar dados processados
        return res.status(200).json({
            success: true,
            data: {
                description: extractedData.description,
                value: extractedData.value,
                date: extractedData.date,
                confidence: 95 // Alta confiança para análise da OpenAI
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro interno:', error);
        
        // Log para monitoramento (sem expor detalhes)
        console.log('🚨 Erro na análise', {
            ip: clientIP,
            timestamp: new Date().toISOString(),
            error: error.message
        });

        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
}

// Função auxiliar para validação de base64
function isValidBase64(str) {
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
}

// Função auxiliar para sanitização
function sanitizeString(input, maxLength = 100) {
    if (typeof input !== 'string') {
        return '';
    }
    
    return input
        .substring(0, maxLength)
        .replace(/<[^>]*>/g, '') // Remover HTML
        .replace(/[<>"'&]/g, '') // Remover caracteres perigosos
        .trim();
}