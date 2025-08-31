// API segura para atualização de dados no Supabase
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
    const { table, data, filters, select } = req.body;

    // Validar parâmetros obrigatórios
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    if (!filters || !Array.isArray(filters) || filters.length === 0) {
      return res.status(400).json({ error: 'Filters are required for update operations' });
    }

    // Validações específicas por tabela
    if (table === 'lancamentos' && data.valor !== undefined) {
      if (isNaN(parseFloat(data.valor)) || parseFloat(data.valor) <= 0) {
        return res.status(400).json({ error: 'Invalid value amount' });
      }
    }

    if (table === 'lancamentos' && data.categoria !== undefined) {
      const validCategories = ['Alimentação', 'Deslocamento', 'Hospedagem', 'Outros'];
      if (!validCategories.includes(data.categoria)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Construir query de atualização
    let query = supabase.from(table).update(data);

    // Aplicar filtros
    filters.forEach(filter => {
      const { column, operator, value } = filter;
      switch (operator) {
        case 'eq':
          query = query.eq(column, value);
          break;
        case 'neq':
          query = query.neq(column, value);
          break;
        case 'gt':
          query = query.gt(column, value);
          break;
        case 'gte':
          query = query.gte(column, value);
          break;
        case 'lt':
          query = query.lt(column, value);
          break;
        case 'lte':
          query = query.lte(column, value);
          break;
        case 'like':
          query = query.like(column, value);
          break;
        case 'in':
          query = query.in(column, value);
          break;
        default:
          console.warn(`Operador não suportado: ${operator}`);
      }
    });

    // Aplicar select se especificado
    if (select) {
      query = query.select(select);
    } else {
      query = query.select('*');
    }

    // Executar atualização
    const { data: updatedData, error } = await query;

    if (error) {
      console.error('Erro na atualização Supabase:', error);
      return res.status(500).json({ error: 'Database update failed', details: error.message });
    }

    return res.status(200).json({ success: true, data: updatedData });

  } catch (error) {
    console.error('Erro interno na API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}