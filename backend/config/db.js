import mysql from "mysql";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "crud",
  port: process.env.DB_PORT || 4306,
};

const dbPool = mysql.createPool(DB_CONFIG);

dbPool.getConnection((err, connection) => {
  if (err) console.error(`DB Failed ❌: ${err.message}`);
  else {
    console.log("DB Connected ✅");
    connection.release();
  }
});

export const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    dbPool.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export default dbPool;