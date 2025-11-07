const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Zevtabs@2024',
  port: 5432,
});

const find = async (mashiniiDugaar: any) => {
  var khariu = await pool.query('SELECT * FROM tokimashin WHERE mashiniiDugaar = $1', [mashiniiDugaar]);
  return khariu.rows;
};

const insertOne = async (body: any) => {
  const { mashiniiDugaar } = body;
  await pool.query('INSERT INTO tokimashin (mashiniiDugaar) VALUES ($1)', [mashiniiDugaar]);
  return 'Amjilttai';
};
const deleteMany = async (body: any) => {
  const { mashiniiDugaar } = body;
  await pool.query('DELETE FROM tokimashin WHERE mashiniiDugaar = $1', [mashiniiDugaar]);
  return 'Amjilttai';
};

export default {
  find,
  insertOne,
  deleteMany,
};
//export = tokiMashin;
//module.exports = tokiMashin;
