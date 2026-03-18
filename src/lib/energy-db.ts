import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.ENERGY_DB_HOST,
  port: Number(process.env.ENERGY_DB_PORT),
  database: process.env.ENERGY_DB_NAME,
  user: process.env.ENERGY_DB_USER,
  password: process.env.ENERGY_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
})

export default pool
