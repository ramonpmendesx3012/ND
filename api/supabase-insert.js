// API segura para inserção de dados no Supabase
const { createClient } = require('@supabase/supabase-js');

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
    const { table, data, select } = req.body;

    // Validar parâmetros obrigatórios
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    // Validações específicas por tabela
    if (table === 'lancamentos') {
      const requiredFields = ['nd_id', 'data_despesa', 'valor', 'categoria', 'descricao', 'imagem_url'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          missingFields 
        });
      }

      // Validar valor
      if (isNaN(parseFloat(data.valor)) || parseFloat(data.valor) <= 0) {
        return res.status(400).json({ error: 'Invalid value amount' });
      }

      // Validar categoria
      const validCategories = ['Alimentação', 'Deslocamento', 'Hospedagem', 'Outros'];
      if (!validCategories.includes(data.categoria)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    if (table === 'nd_viagens') {
      const requiredFields = ['numero_nd'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          missingFields 
        });
      }
    }

    // Construir query de inserção
    let query = supabase.from(table).insert(data);

    // Aplicar select se especificado
    if (select) {
      query = query.select(select);
    } else {
      query = query.select('*');
    }

    // Executar inserção
    const { data: insertedData, error } = await query;

    if (error) {
      console.error('Erro na inserção Supabase:', error);
      return res.status(500).json({ error: 'Database insert failed', details: error.message });
    }

    return res.status(201).json({ success: true, data: insertedData });

  } catch (error) {
    console.error('Erro interno na API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}