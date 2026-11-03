const sqlite = typeof process.getBuiltinModule === 'function' 
  ? process.getBuiltinModule('node:sqlite') 
  : eval("require('node:sqlite')");
const { DatabaseSync } = sqlite;
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_FILE || path.join(__dirname, '../../data/ecommerce.sqlite');
const schemaPath = path.join(__dirname, '../../data/schema.sql');

// Ensure data directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Initialize schema
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

module.exports = {
  db,
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },
  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },
  exec(sql) {
    return db.exec(sql);
  }
};
