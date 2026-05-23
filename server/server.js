/* =========================
   ENV CONFIG
========================= */

require("dotenv").config();

/* =========================
   IMPORTS
========================= */

const express =
require("express");

const cors =
require("cors");

const path =
require("path");

/* =========================
   EXPRESS APP
========================= */

const app = express();

/* =========================
   ROUTES
========================= */

const transactionRoutes =
require("./routes/transactions");

const aiRoutes =
require("./routes/ai");

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());

/* =========================
   API ROUTES
========================= */

app.use(
  "/api/transactions",
  transactionRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

/* =========================
   STATIC FRONTEND
========================= */

app.use(
  express.static(
    path.join(
      __dirname,
      "../public"
    )
  )
);

/* =========================
   HOME ROUTE
========================= */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "../public/index.html"
    )
  );

});

/* =========================
   SERVER START
========================= */

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});