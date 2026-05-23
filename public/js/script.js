/* =========================
   DARK MODE TOGGLE
========================= */

const themeToggle =
document.getElementById("themeToggle");

if (themeToggle) {

  themeToggle.addEventListener(
    "click",
    () => {

      document.body.classList.toggle("dark");

      if (
        document.body.classList.contains("dark")
      ) {

        localStorage.setItem(
          "theme",
          "dark"
        );

      } else {

        localStorage.setItem(
          "theme",
          "light"
        );

      }

    }
  );

}

/* =========================
   LOAD SAVED THEME
========================= */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    const savedTheme =
      localStorage.getItem("theme");

    if (savedTheme === "dark") {

      document.body.classList.add("dark");

    }

  }
);

/* =========================
   LOAD TRANSACTIONS
========================= */

async function loadTransactions() {

  try {

    const response =
      await fetch("/api/transactions");

    const data =
      await response.json();

    const transactionList =
      document.getElementById(
        "transactionList"
      );

    if (!transactionList) return;

    transactionList.innerHTML = "";

    data.transactions.forEach(
      (transaction) => {

        const item =
          document.createElement("div");

        item.classList.add(
          "transaction-item"
        );

        item.innerHTML = `

          <div class="transaction-left">

            <span class="transaction-category">
              ${transaction.category}
            </span>

            <span class="transaction-description">
              ${transaction.description || "No description"}
            </span>

          </div>

          <div class="transaction-right">

            <div class="transaction-amount
              ${
                transaction.type === "Expense"
                ? "expense-text"
                : "income-text"
              }">

              ${
                transaction.type === "Expense"
                ? "-"
                : "+"
              }

              ₹${transaction.amount}

            </div>

            <div class="transaction-date">
              ${transaction.createdAt}
            </div>

            <button
              class="delete-btn"
              onclick="deleteTransaction(${transaction.id})"
            >
              Delete
            </button>

          </div>

        `;

        transactionList.appendChild(item);

      }
    );

  } catch (error) {

    console.log(
      "Failed to load transactions:",
      error
    );

  }

}
/* =========================
   COUNT UP ANIMATION
========================= */

function animateValue(
  element,
  start,
  end,
  duration
) {

  let startTimestamp = null;

  const step = (timestamp) => {

    if (!startTimestamp)
      startTimestamp = timestamp;

    const progress = Math.min(
      (timestamp - startTimestamp)
      / duration,
      1
    );

    const value = Math.floor(
      progress * (end - start)
      + start
    );

    element.innerText =
      `₹${value.toLocaleString()}`;

    if (progress < 1) {

      window.requestAnimationFrame(step);

    }

  };

  window.requestAnimationFrame(step);

}
/* =========================
   LOAD SUMMARY
========================= */

async function loadSummary() {

  try {

    const response =
      await fetch(
        "/api/transactions/stats/summary"
      );

    const data =
      await response.json();

    const balanceElement =
      document.getElementById(
        "balanceAmount"
      );

    const incomeElement =
      document.getElementById(
        "incomeAmount"
      );

    const expenseElement =
      document.getElementById(
        "expenseAmount"
      );
      const savingsElement =
document.getElementById(
  "savingsAmount"
);

    if (balanceElement) {

     animateValue(
  balanceElement,
  0,
  data.balance || 0,
  1000
);

    }

   /* INCOME */

if (incomeElement) {

  incomeElement.innerText = "₹0";

  animateValue(
    incomeElement,
    0,
    Number(data.income) || 0,
    1200
  );

}

    if (expenseElement) {

     animateValue(
  expenseElement,
  0,
  data.expense || 0,
  1000
);

    }
    /* SAVINGS */

if (savingsElement) {

  savingsElement.innerText = "₹0";

  animateValue(
    savingsElement,
    0,
    Number(data.balance) || 0,
    1200
  );

}

  } catch (error) {

    console.log(
      "Failed to load summary:",
      error
    );

  }

}

/* =========================
   ADD TRANSACTION
========================= */

async function addTransaction() {

  const input =
    document.querySelector(
      ".transaction-box input"
    );

  const select =
    document.querySelector(
      ".transaction-box select"
    );

  const value =
    input.value.trim();

  if (!value) {

    alert(
      "Please enter transaction"
    );

    return;

  }

  const amount =
    prompt("Enter amount:");

  if (!amount) return;

  try {

    const response = await fetch(
      "/api/transactions",
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          type: select.value,

          category: value,

          amount: Number(amount),

          description: value

        })

      }
    );

    const data =
      await response.json();

    if (data.success) {

      input.value = "";

      loadTransactions();

      loadSummary();

      loadCharts();

    }

  } catch (error) {

    console.log(
      "Failed to add transaction:",
      error
    );

  }

}

/* =========================
   DELETE TRANSACTION
========================= */

async function deleteTransaction(id) {

  try {

    await fetch(
      `/api/transactions/${id}`,
      {

        method: "DELETE"

      }
    );

    loadTransactions();

    loadSummary();

    loadCharts();

  } catch (error) {

    console.log(
      "Delete failed:",
      error
    );

  }

}

/* =========================
   LOAD CHARTS
========================= */

let categoryChartInstance = null;

async function loadCharts() {

  try {

    const response =
      await fetch(
        "/api/transactions/stats/categories"
      );

    const data =
      await response.json();

    const labels =
      data.categories.map(
        item => item.category
      );

    const totals =
      data.categories.map(
        item => item.total
      );

    const categoryCanvas =
      document.getElementById(
        "expenseChart"
      );

    if (!categoryCanvas) return;

    /* DESTROY OLD CHART */

    if (categoryChartInstance) {

      categoryChartInstance.destroy();

    }

    /* CREATE NEW CHART */

    categoryChartInstance =
    new Chart(categoryCanvas, {

      type: "doughnut",

           data: {

        labels: labels,

        datasets: [{

          label: "Expenses",

          data: totals,

          borderWidth: 2,

          hoverOffset: 14

        }]

      },

      options: {

        responsive: true,

        maintainAspectRatio: true,

        animation: {

          animateRotate: true,

          animateScale: true,

          duration: 2200,

          easing: "easeOutQuart"

        },

        plugins: {

          legend: {

            position: "bottom",

            labels: {

              padding: 20,

              usePointStyle: true,

              pointStyle: "circle"

            }

          }

        }

      }

    });

  } catch (error) {

    console.log(
      "Chart loading failed:",
      error
    );

  }

}

/* =========================
   BUTTON EVENT
========================= */

const transactionBtn =
document.querySelector(
  ".transaction-box button"
);

/* =========================
   MONTHLY CHART
========================= */

let monthlyChartInstance = null;

async function loadMonthlyChart() {

  try {

    const response =
      await fetch(
        "/api/transactions/stats/monthly"
      );

    const data =
      await response.json();

    console.log(data);

    const labels =
      data.monthly.map(
        item => item.month
      );

    const totals =
      data.monthly.map(
        item => item.total
      );

    const canvas =
      document.getElementById(
        "monthlyChart"
      );

    if (!canvas) {

      console.log(
        "monthlyChart canvas missing"
      );

      return;

    }

    const ctx =
      canvas.getContext("2d");

    if (monthlyChartInstance) {

      monthlyChartInstance.destroy();

    }

    monthlyChartInstance =
    new Chart(ctx, {

      type: "line",

      data: {

        labels: labels,

        datasets: [{

          label: "Monthly Expenses",

          data: totals,

          tension: 0.4,

          fill: false

        }]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false

      }

    });

  } catch (error) {

    console.log(
      "Monthly chart error:",
      error
    );

  }

}

/* =========================
   LOAD BUDGET DATA
========================= */

/* =========================
   LOAD BUDGET DATA
========================= */

async function loadBudgetData() {

  try {

    /* FETCH SUMMARY */

    const summaryResponse =
      await fetch(
        "/api/transactions/stats/summary"
      );

    const summaryData =
      await summaryResponse.json();

    /* FETCH BUDGET */

    const budgetResponse =
      await fetch(
        "/api/transactions/budget"
      );

    const budgetData =
      await budgetResponse.json();

    /* SAFE NUMBERS */

    const income =
      Number(
        summaryData.income
      ) || 0;

    const expense =
      Number(
        summaryData.expense
      ) || 0;

    const monthlyBudget =
      Number(
        budgetData.budget
      ) || 50000;

    const remainingBudget =
      monthlyBudget - expense;

    /* UPDATE UI */

    const monthlyBudgetElement =
      document.getElementById(
        "monthlyBudget"
      );

    if (monthlyBudgetElement) {

      monthlyBudgetElement.innerText = "₹0";

      animateValue(
        monthlyBudgetElement,
        0,
        monthlyBudget,
        1200
      );

    }

    const remainingBudgetElement =
      document.getElementById(
        "remainingBudget"
      );

    if (remainingBudgetElement) {

      remainingBudgetElement.innerText = "₹0";

      animateValue(
        remainingBudgetElement,
        0,
        remainingBudget,
        1200
      );

    }

    /* LOAD BUDGET USAGE */

    loadBudgetUsage(
      monthlyBudget
    );

  } catch (error) {

    console.log(
      "Budget Data Error:",
      error
    );

  }

}

/* =========================
   LOAD BUDGET USAGE
========================= */

async function loadBudgetUsage(
  monthlyBudget
) {

  try {

    const response =
      await fetch(
        "/api/transactions/stats/categories"
      );

    const data =
      await response.json();

    const container =
      document.getElementById(
        "budgetUsageContainer"
      );

    if (!container) return;

    container.innerHTML = "";

    data.categories.forEach(
      (item) => {

        const amount =
          Number(item.total) || 0;

        const percent =
          (
            amount
            / monthlyBudget
          ) * 100;

        let colorClass = 'green';
        if (percent >= 66) {
          colorClass = 'red';
        } else if (percent >= 33) {
          colorClass = 'orange';
        }

        const div =
          document.createElement(
            "div"
          );

        div.classList.add(
          "budget-item"
        );

        div.innerHTML = `

          <div class="budget-info">

            <div>

              <h4>
                ${item.category}
              </h4>

              <p>
                ₹${amount.toLocaleString()}
              </p>

            </div>

            <span>
              ${percent.toFixed(1)}%
            </span>

          </div>

          <div class="budget-bar">

            <div
              class="budget-fill ${colorClass}"
              style="
                width:
                ${percent}%;
              "
            ></div>

          </div>

        `;

        container.appendChild(
          div
        );

      }
    );

  } catch (error) {

    console.log(
      "Budget Usage Error:",
      error
    );

  }

}
/* =========================
   AI TRANSACTION INPUT
========================= */

async function sendAITransaction() {

  const input =
    document.getElementById(
      "aiTransactionInput"
    );

  const text =
    input.value.trim();

  if (!text) {

    alert("Please enter a transaction description");

    return;

  }

  try {

    const response =
      await fetch(
        "/api/ai/parse",
        {

          method: "POST",

          headers: {

            "Content-Type":
            "application/json"

          },

          body: JSON.stringify({

            text: text

          })

        }
      );

    const data =
      await response.json();

    console.log(data);

    if (!response.ok) {

      alert(
        "Error: " +
        (data.error || data.message || "Failed to add transaction")
      );

      return;

    }

    if (data.success) {

      input.value = "";

      /* REFRESH EVERYTHING */

      loadTransactions();

      loadSummary();

      loadCharts();

      loadMonthlyChart();

      loadBudgetData();

    } else {

      alert(
        "Error: " +
        (data.message || "Failed to add transaction")
      );

    }

  } catch (error) {

    console.log(
      "AI Transaction Error:",
      error
    );

    alert(
      "Network error: " +
      error.message
    );

  }

}

const aiInput =
document.getElementById(
  "aiTransactionInput"
);

if (aiInput) {

  aiInput.addEventListener(
    "keypress",
    (e) => {

      if (e.key === "Enter") {

        sendAITransaction();

      }

    }
  );

}

const aiSendBtn =
document.getElementById(
  "aiSendBtn"
);

if (aiSendBtn) {

  aiSendBtn.addEventListener(
    "click",
    () => {

      sendAITransaction();

    }
  );

}

/* =========================
   CURRENT MONTH + YEAR
========================= */

function loadCurrentDate() {

  const element =
    document.getElementById(
      "currentMonthYear"
    );

  if (!element) return;

  const now =
    new Date();

  const formatted =
    now.toLocaleString(
      "en-US",
      {

        month: "long",

        year: "numeric"

      }
    );

  element.innerText =
    formatted;


}

/* =========================
   LOAD AI INSIGHTS
========================= */

async function loadAIInsights() {

  try {

    const response =
      await fetch(
        "/api/transactions/stats/insights"
      );

    const data =
      await response.json();

    const container =
      document.getElementById(
        "aiInsights"
      );

    if (!container) return;

    container.innerHTML = "";

    data.insights.forEach(
      (insight) => {

        const div =
          document.createElement(
            "div"
          );

        div.classList.add(
          "insight-item"
        );

        div.innerHTML = `

          <p>${insight}</p>

        `;

        container.appendChild(
          div
        );

      }
    );

  } catch (error) {

    console.log(
      "AI Insights Error:",
      error
    );

  }

}
/* =========================
   LOAD BUDGET INSIGHTS
========================= */

async function loadBudgetInsights() {

  try {

    const response =
      await fetch(
        "/api/transactions/stats/budget-insights"
      );

    const data =
      await response.json();

    const container =
      document.getElementById(
        "budgetInsights"
      );

    if (!container) return;

    container.innerHTML = "";

    data.insights.forEach(
      (insight) => {

        const div =
          document.createElement(
            "div"
          );

        div.classList.add(
          "insight-item"
        );

        div.innerHTML = `

          <p>${insight}</p>

        `;

        container.appendChild(
          div
        );

      }
    );

  } catch (error) {

    console.log(
      "Budget Insights Error:",
      error
    );

  }

}
/* =========================
   BUDGET MODAL LOGIC
========================= */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    const openBtn =
      document.getElementById(
        "openBudgetModal"
      );

    const modal =
      document.getElementById(
        "budgetModal"
      );

    const closeBtn =
      document.getElementById(
        "closeBudgetModal"
      );

    const saveBtn =
      document.getElementById(
        "saveBudgetBtn"
      );

    const budgetInput =
      document.getElementById(
        "budgetInput"
      );

    /* OPEN MODAL */

    if (
      openBtn &&
      modal
    ) {

      openBtn
      .addEventListener(
        "click",
        () => {

          modal.classList.add(
            "active"
          );

        }
      );

    }

    /* CLOSE MODAL */

    if (
      closeBtn &&
      modal
    ) {

      closeBtn
      .addEventListener(
        "click",
        () => {

          modal.classList.remove(
            "active"
          );

        }
      );

    }

    /* SAVE BUDGET */

    if (saveBtn) {

      saveBtn.addEventListener(
        "click",
        async () => {

          const budgetValue =
            budgetInput.value.trim();

          if (!budgetValue) {

            alert(
              "Please enter a budget amount"
            );

            return;

          }

          try {

            const response =
              await fetch(
                "/api/transactions/budget",
                {

                  method: "POST",

                  headers: {

                    "Content-Type":
                      "application/json"

                  },

                  body: JSON.stringify({

                    budget: Number(
                      budgetValue
                    )

                  })

                }
              );

            const data =
              await response.json();

            if (data.success) {

              modal.classList.remove(
                "active"
              );

              budgetInput.value = "";

              loadBudgetData();

            } else {

              alert(
                "Failed to save budget"
              );

            }

          } catch (error) {

            console.log(
              "Budget Save Error:",
              error
            );

            alert(
              "Error saving budget"
            );

          }

        }
      );

    }

}
);
/* =========================
   INITIAL LOAD
========================= */

loadTransactions();

loadSummary();

loadCharts();

loadMonthlyChart();

loadBudgetData();

loadAIInsights();

loadBudgetInsights();



