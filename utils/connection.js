const mysql = require("mysql");

const connection = mysql.createConnection({
  database: process.env.DB_NAME,
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  host: process.env.DB_HOST,
  port: 3306,
});
connection.connect();

function asyncMySQL(query, params) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, results) => {
      if (error) {
        reject(error);
      }

      resolve(results);
    });
  });
}

module.exports = asyncMySQL;
