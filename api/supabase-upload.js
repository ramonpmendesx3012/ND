// API segura para upload de arquivos no Supabase Storage
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileBase64, fileName, bucket = 'comprovantes' } = req.body;

    // Validar parâmetros obrigatórios
    if (!fileBase64) {
      return res.status(400).json({ error: 'File data (base64) is required' });
    }

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    // Validar formato do arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const mimeType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    }[fileExtension];

    if (!mimeType || !allowedTypes.includes(mimeType)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG and WebP are allowed' 
      });
    }

    // Converter base64 para buffer
    let fileBuffer;
    try {
      // Remover prefixo data:image/...;base64, se presente
      const base64Data = fileBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid base64 data' });
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileBuffer.length > maxSize) {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB' 
      });
    }

    // Sanitizar e gerar nome único para o arquivo
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Substituir caracteres especiais por underscore
      .replace(/_{2,}/g, '_') // Substituir múltiplos underscores por um só
      .replace(/^_|_$/g, ''); // Remover underscores do início e fim
    
    const uniqueFileName = `${uuidv4()}-${sanitizedFileName}`;
    const filePath = `uploads/${uniqueFileName}`;

    // Verificar se o bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Erro ao listar buckets:', bucketsError);
      return res.status(500).json({ error: 'Storage service error' });
    }
    
    const bucketExists = buckets.some(b => b.name === bucket);
    if (!bucketExists) {
      console.error(`Bucket '${bucket}' não existe. Buckets disponíveis:`, buckets.map(b => b.name));
      return res.status(500).json({ error: `Storage bucket '${bucket}' not found` });
    }
    
    // Upload para o Supabase Storage
    console.log(`Fazendo upload para: ${bucket}/${filePath}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload Supabase:', uploadError);
      return res.status(500).json({ 
        error: 'Upload failed', 
        details: uploadError.message 
      });
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return res.status(500).json({ 
        error: 'Failed to get public URL' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        path: uploadData.path,
        fullPath: uploadData.fullPath,
        publicUrl: urlData.publicUrl,
        fileName: uniqueFileName,
        originalName: fileName,
        size: fileBuffer.length,
        mimeType: mimeType
      }
    });

  } catch (error) {
    console.error('Erro interno na API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// Configuração para permitir arquivos grandes
// Configuração para Vercel (não necessária no Node.js local)
// module.exports.config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '50mb',
//     },
//   },
// };