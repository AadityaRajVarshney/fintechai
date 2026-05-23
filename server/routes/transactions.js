const express =
require("express");

const router =
express.Router();

const db =
require("../db");

/* =========================
   GET ALL TRANSACTIONS
========================= */

router.get("/", (req, res) => {

  const query = `
    SELECT *
    FROM transactions
    ORDER BY createdAt DESC
  `;

  db.all(query, [], (err, rows) => {

    if (err) {

      return res.status(500).json({

        success: false,

        error: err.message

      });

    }

    res.json({

      success: true,

      transactions: rows

    });

  });

});

/* =========================
   ADD TRANSACTION
========================= */

router.post("/", (req, res) => {

  const {

    type,

    category,

    amount,

    description

  } = req.body;

  if (
    !type ||
    !category ||
    !amount
  ) {

    return res.status(400).json({

      success: false,

      message:
      "Missing required fields"

    });

  }

  const query = `

    INSERT INTO transactions

    (
      type,
      category,
      amount,
      description
    )

    VALUES (?, ?, ?, ?)

  `;

  db.run(

    query,

    [

      type,

      category,

      amount,

      description

    ],

    function(err) {

      if (err) {

        return res.status(500).json({

          success: false,

          error: err.message

        });

      }

      res.json({

        success: true,

        message:
        "Transaction added",

        transactionId:
        this.lastID

      });

    }

  );

});

/* =========================
   DELETE TRANSACTION
========================= */

router.delete("/:id", (req, res) => {

  const id =
  req.params.id;

  const query = `
    DELETE FROM transactions
    WHERE id = ?
  `;

  db.run(

    query,

    [id],

    function(err) {

      if (err) {

        return res.status(500).json({

          success: false,

          error: err.message

        });

      }

      res.json({

        success: true,

        message:
        "Transaction deleted"

      });

    }

  );

});

/* =========================
   GET SUMMARY
========================= */

router.get(
  "/stats/summary",
  (req, res) => {

    const query = `

      SELECT
        type,
        SUM(amount) as total

      FROM transactions

      GROUP BY type

    `;

    db.all(query, [], (err, rows) => {

      if (err) {

        return res.status(500).json({

          success: false,

          error: err.message

        });

      }

      let income = 0;

      let expense = 0;

      rows.forEach((row) => {

        if (
          row.type === "Income"
        ) {

          income = row.total;

        }

        if (
          row.type === "Expense"
        ) {

          expense = row.total;

        }

      });

      res.json({

        success: true,

        income,

        expense,

        balance:
        income - expense

      });

    });

  }
);

/* =========================
   CATEGORY STATS
========================= */

router.get(
  "/stats/categories",
  (req, res) => {

    const query = `

      SELECT
        category,
        SUM(amount) as total

      FROM transactions

      WHERE type = 'Expense'

      GROUP BY category

    `;

    db.all(query, [], (err, rows) => {

      if (err) {

        return res.status(500).json({

          success: false,

          error: err.message

        });

      }

      res.json({

        success: true,

        categories: rows

      });

    });

  }
);

/* =========================
   MONTHLY TRENDS
========================= */

router.get(
  "/stats/monthly",
  (req, res) => {

    const query = `

      SELECT
        strftime('%m', createdAt)
        as month,

        SUM(amount)
        as total

      FROM transactions

      WHERE type = 'Expense'

      GROUP BY month

      ORDER BY month

    `;

    db.all(query, [], (err, rows) => {

      if (err) {

        return res.status(500).json({

          success: false,

          error: err.message

        });

      }

      res.json({

        success: true,

        monthly: rows

      });

    });

  }
);

/* =========================
   GET MONTHLY BUDGET
========================= */

router.get(
  "/budget",
  (req, res) => {

    const query = `

      SELECT monthlyBudget

      FROM budget

      WHERE id = 1

    `;

    db.get(

      query,

      [],

      (err, row) => {

        if (err) {

          return res.status(500).json({

            success: false,

            error: err.message

          });

        }

        res.json({

          success: true,

          budget:
          row
          ? row.monthlyBudget
          : 50000

        });

      }

    );

  }
);

/* =========================
   UPDATE MONTHLY BUDGET
========================= */

router.post(
  "/budget",
  (req, res) => {

    const {
      budget
    } = req.body;

    if (!budget) {

      return res.status(400).json({

        success: false,

        message:
        "Budget required"

      });

    }

    if (budget > 99999999) {

      return res.status(400).json({

        success: false,

        message:
        "Budget cannot exceed 99,999,999"

      });

    }

    const query = `

      UPDATE budget

      SET monthlyBudget = ?

      WHERE id = 1

    `;

    db.run(

      query,

      [budget],

      function(err) {

        if (err) {

          return res.status(500).json({

            success: false,

            error: err.message

          });

        }

        res.json({

          success: true,

          monthlyBudget: budget

        });

      }

    );

  }
);
/* =========================
   FIXED: BUDGET INSIGHTS 
   (Matches frontend call: /stats/budget)
========================= */
router.get("/stats/budget", (req, res) => {
  const query = `
    SELECT 
      (SELECT monthlyBudget FROM budget LIMIT 1) as budget,
      SUM(amount) as totalSpent
    FROM transactions 
    WHERE type = 'Expense' 
    AND strftime('%m', createdAt) = strftime('%m', 'now')
    AND strftime('%Y', createdAt) = strftime('%Y', 'now')
  `;

  db.get(query, [], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    const budget = row ? row.budget : 50000;
    const spent = row ? row.totalSpent : 0;

    res.json({
      success: true,
      budget: budget || 50000,
      spent: spent || 0,
      remaining: (budget || 50000) - (spent || 0)
    });
  });
});
/* =========================
   NEW: GENERAL INSIGHTS
   (Matches frontend call: /stats/insights)
========================= */
router.get("/stats/insights", (req, res) => {
  const query = `
    SELECT category, SUM(amount) as total
    FROM transactions 
    WHERE type = 'Expense' 
    GROUP BY category 
    ORDER BY total DESC 
    LIMIT 1
  `;

  db.get(query, [], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      topCategory: row ? row.category : "None",
      highestSpend: row ? row.total : 0
    });
  });
});

/* =========================
   EXPORT ROUTER
========================= */

module.exports = router;