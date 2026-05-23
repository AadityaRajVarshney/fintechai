const express = require("express");

const router = express.Router();

const {
  GoogleGenerativeAI
} = require(
  "@google/generative-ai"
);

const db =
require("../db.js");

const genAI =
new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model =
genAI.getGenerativeModel({

  model: "gemini-2.5-flash"

});

/* =========================
   AI TRANSACTION PARSER
========================= */

router.post(
  "/parse",
  async (req, res) => {

    try {

      const { text } = req.body;

      if (!text) {

        return res.status(400).json({

          success: false,

          message:
          "Text is required"

        });

      }

      const prompt = `

Extract the financial transaction
from this sentence.

Return ONLY valid JSON.

Format:

{
  "type": "Expense or Income",
  "category": "Category",
  "amount": number,
  "description": "short description"
}

Sentence:
"${text}"

`;

      const result =
      await model.generateContent(
        prompt
      );

      const response =
      await result.response;

      const rawText =
      response.text();

      const cleaned =
      rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed =
      JSON.parse(cleaned);

      /* SAVE TO DATABASE */

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

          parsed.type,

          parsed.category,

          parsed.amount,

          parsed.description

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

            transaction: {

              id: this.lastID,

              ...parsed

            }

          });

        }
      );

    } catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);

module.exports = router;