const sqlite3 =
require("sqlite3").verbose();

const path =
require("path");

/* =========================
   DATABASE PATH
========================= */

const dbPath = path.join(
  __dirname,
  "../database/finance.db"
);

/* =========================
   CONNECT DATABASE
========================= */

const db =
new sqlite3.Database(

  dbPath,

  (err) => {

    if (err) {

      console.log(
        "Database connection failed:",
        err.message
      );

    } else {

      console.log(
        "Connected to SQLite database"
      );

    }

  }

);

/* =========================
   CREATE TABLES
========================= */

db.serialize(() => {

  /* TRANSACTIONS TABLE */

  db.run(`

    CREATE TABLE IF NOT EXISTS transactions (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      type TEXT NOT NULL,

      category TEXT NOT NULL,

      amount REAL NOT NULL,

      description TEXT,

      createdAt DATETIME
      DEFAULT CURRENT_TIMESTAMP

    )

  `);

  /* CATEGORY BUDGET TABLE */

  db.run(`

    CREATE TABLE IF NOT EXISTS budgets (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      category TEXT NOT NULL,

      limitAmount REAL NOT NULL,

      month TEXT NOT NULL

    )

  `);

  /* MONTHLY BUDGET TABLE */

  db.run(`

    CREATE TABLE IF NOT EXISTS budget (

      id INTEGER PRIMARY KEY,

      monthlyBudget REAL NOT NULL

    )

  `);

});

/* =========================
   DEFAULT MONTHLY BUDGET
========================= */

db.get(

  `
  SELECT * FROM budget
  LIMIT 1
  `,

  [],

  (err, row) => {

    if (err) {

      console.log(
        "Budget fetch error:",
        err.message
      );

      return;

    }

    /* INSERT DEFAULT */

    if (!row) {

      db.run(

        `
        INSERT INTO budget
        (
          id,
          monthlyBudget
        )

        VALUES
        (
          1,
          50000
        )
        `,

        (err) => {

          if (err) {

            console.log(
              "Default budget insert error:",
              err.message
            );

          } else {

            console.log(
              "Default monthly budget created."
            );

          }

        }

      );

    }

  }

);

/* =========================
   EXPORT DATABASE
========================= */

module.exports = db;