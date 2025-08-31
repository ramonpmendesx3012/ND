// Módulo de banco de dados SQLite local
// Persistência real sem dependências externas

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'data', 'usuarios.db');
const fs = require('fs');

// Criar diretório data se não existir
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Conexão com SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar SQLite:', err.message);
  } else {
    console.log('✅ Conectado ao banco SQLite:', dbPath);
  }
});

// Função para executar queries
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        const duration = Date.now() - start;
        if (err) {
          console.error('❌ Erro na query SELECT:', err.message);
          console.error('📝 SQL:', sql);
          console.error('📋 Params:', params);
          reject(err);
        } else {
          console.log(`🗄️ Query SELECT executada em ${duration}ms: ${rows.length} registros`);
          resolve({ rows });
        }
      });
    } else {
      db.run(sql, params, function(err) {
        const duration = Date.now() - start;
        if (err) {
          console.error('❌ Erro na query:', err.message);
          console.error('📝 SQL:', sql);
          console.error('📋 Params:', params);
          reject(err);
        } else {
          console.log(`🗄️ Query executada em ${duration}ms`);
          resolve({ 
            rows: [{ id: this.lastID }],
            lastID: this.lastID,
            changes: this.changes 
          });
        }
      });
    }
  });
}

// Função para testar conexão
async function testConnection() {
  try {
    const result = await query('SELECT datetime("now") as current_time');
    console.log('✅ Conexão SQLite estabelecida:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão SQLite:', error.message);
    return false;
  }
}

// Função para criar tabelas
async function initializeTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      ativo BOOLEAN DEFAULT 0,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultimo_login DATETIME,
      tentativas_login INTEGER DEFAULT 0,
      bloqueado_ate DATETIME
    )
  `;

  const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
    'CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf)',
    'CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo)'
  ];

  try {
    await query(createUsersTable);
    
    for (const indexSql of createIndexes) {
      await query(indexSql);
    }
    
    console.log('✅ Tabelas SQLite inicializadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar tabelas SQLite:', error.message);
    return false;
  }
}

// Função para inserir usuário com RETURNING simulado
async function insertUser(userData) {
  try {
    const insertSql = `
      INSERT INTO usuarios (nome, email, cpf, senha_hash, ativo) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await query(insertSql, [
      userData.nome,
      userData.email,
      userData.cpf,
      userData.senha_hash,
      userData.ativo ? 1 : 0
    ]);
    
    // Buscar o usuário inserido
    const selectSql = `
      SELECT id, nome, email, cpf, ativo, data_criacao, data_atualizacao
      FROM usuarios 
      WHERE id = ?
    `;
    
    const userResult = await query(selectSql, [result.lastID]);
    return userResult.rows[0];
  } catch (error) {
    throw error;
  }
}

// Função para fechar conexão
function closeDatabase() {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('❌ Erro ao fechar SQLite:', err.message);
      } else {
        console.log('✅ Banco SQLite fechado');
      }
      resolve();
    });
  });
}

// Exportar funções
module.exports = {
  query,
  testConnection,
  initializeTables,
  insertUser,
  closeDatabase,
  db
};

// Inicializar ao carregar módulo
(async () => {
  const connected = await testConnection();
  if (connected) {
    await initializeTables();
  }
})();

// Fechar banco ao encerrar processo
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});