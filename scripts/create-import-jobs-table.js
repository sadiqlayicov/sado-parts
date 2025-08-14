const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createImportJobsTable() {
  let client;
  
  try {
    client = await pool.connect();
    
    console.log('Creating import_jobs table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_jobs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL DEFAULT 'import',
        file_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_items INTEGER DEFAULT 0,
        processed_items INTEGER DEFAULT 0,
        created_count INTEGER DEFAULT 0,
        updated_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ import_jobs table created successfully!');
    
    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at);
    `);
    
    console.log('✅ Indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating import_jobs table:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

createImportJobsTable();
