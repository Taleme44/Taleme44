const STORAGE_KEY = "defi-dashboard-strategies";

const strategyForm = document.getElementById("strategyForm");
const strategyRows = document.getElementById("strategyRows");
const performanceRows = document.getElementById("performanceRows");
const strategyRowTemplate = document.getElementById("strategyRowTemplate");
const periodTitle = document.getElementById("periodTitle");

const kpiCapital = document.getElementById("kpiCapital");
const kpiCurrent = document.getElementById("kpiCurrent");
const kpiPnl = document.getElementById("kpiPnl");
const kpiRoi = document.getElementById("kpiRoi");

const clearAllBtn = document.getElementById("clearAll");
const seedDemoDataBtn = document.getElementById("seedDemoData");

let selectedPeriod = "daily";
let strategies = loadStrategies();

function loadStrategies() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveStrategies() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value) {
  return `${value.toFixed(2)}%`;
}

function calcPnl(entry) {
  return Number(entry.currentValue) - Number(entry.invested);
}

function calcRoi(entry) {
  if (!Number(entry.invested)) return 0;
  return (calcPnl(entry) / Number(entry.invested)) * 100;
}

function periodKey(date, period) {
  const d = new Date(date);
  if (period === "daily") return d.toISOString().slice(0, 10);
  if (period === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${d.getFullYear()}`;
}

function periodLabel(key, period) {
  if (period === "daily") return key;
  if (period === "monthly") {
    const [year, month] = key.split("-");
    return `${month}.${year}`;
  }
  return key;
}

function aggregateByPeriod(list, period) {
  const map = new Map();
  list.forEach((entry) => {
    const key = periodKey(entry.startDate, period);
    if (!map.has(key)) {
      map.set(key, { key, count: 0, invested: 0, currentValue: 0 });
    }
    const row = map.get(key);
    row.count += 1;
    row.invested += Number(entry.invested);
    row.currentValue += Number(entry.currentValue);
  });

  return [...map.values()]
    .map((row) => {
      const pnl = row.currentValue - row.invested;
      const roi = row.invested ? (pnl / row.invested) * 100 : 0;
      return { ...row, pnl, roi };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}

function renderKpis() {
  const invested = strategies.reduce((sum, s) => sum + Number(s.invested), 0);
  const current = strategies.reduce((sum, s) => sum + Number(s.currentValue), 0);
  const pnl = current - invested;
  const roi = invested ? (pnl / invested) * 100 : 0;

  kpiCapital.textContent = formatCurrency(invested);
  kpiCurrent.textContent = formatCurrency(current);
  kpiPnl.textContent = formatCurrency(pnl);
  kpiRoi.textContent = formatNumber(roi);

  kpiPnl.className = pnl >= 0 ? "pos" : "neg";
  kpiRoi.className = roi >= 0 ? "pos" : "neg";
}

function renderStrategies() {
  strategyRows.innerHTML = "";
  strategies
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .forEach((strategy) => {
      const row = strategyRowTemplate.content.firstElementChild.cloneNode(true);
      row.querySelector(".name").textContent = strategy.name;
      row.querySelector(".category").textContent = strategy.category;
      row.querySelector(".protocol").textContent = strategy.protocol;
      row.querySelector(".chain").textContent = strategy.chain;
      row.querySelector(".startDate").textContent = strategy.startDate;
      row.querySelector(".invested").textContent = formatCurrency(Number(strategy.invested));
      row.querySelector(".currentValue").textContent = formatCurrency(Number(strategy.currentValue));

      const pnl = calcPnl(strategy);
      const roi = calcRoi(strategy);
      const pnlCell = row.querySelector(".pnl");
      const roiCell = row.querySelector(".roi");
      pnlCell.textContent = formatCurrency(pnl);
      roiCell.textContent = formatNumber(roi);
      pnlCell.className = `pnl ${pnl >= 0 ? "pos" : "neg"}`;
      roiCell.className = `roi ${roi >= 0 ? "pos" : "neg"}`;

      row.querySelector(".notes").textContent = strategy.notes || "-";
      row.querySelector(".delete").addEventListener("click", () => {
        strategies = strategies.filter((s) => s.id !== strategy.id);
        saveStrategies();
        renderAll();
      });

      strategyRows.appendChild(row);
    });
}

function renderPerformance() {
  const labels = {
    daily: "Tägliche Auswertung",
    monthly: "Monatliche Auswertung",
    yearly: "Jährliche Auswertung",
  };

  periodTitle.textContent = labels[selectedPeriod];
  performanceRows.innerHTML = "";

  aggregateByPeriod(strategies, selectedPeriod).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${periodLabel(row.key, selectedPeriod)}</td>
      <td>${row.count}</td>
      <td>${formatCurrency(row.invested)}</td>
      <td>${formatCurrency(row.currentValue)}</td>
      <td class="${row.pnl >= 0 ? "pos" : "neg"}">${formatCurrency(row.pnl)}</td>
      <td class="${row.roi >= 0 ? "pos" : "neg"}">${formatNumber(row.roi)}</td>
    `;
    performanceRows.appendChild(tr);
  });
}

function renderAll() {
  renderKpis();
  renderStrategies();
  renderPerformance();
}

strategyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(strategyForm);
  const entry = {
    id: crypto.randomUUID(),
    name: formData.get("name"),
    category: formData.get("category"),
    protocol: formData.get("protocol"),
    chain: formData.get("chain"),
    startDate: formData.get("startDate"),
    invested: Number(formData.get("invested")),
    currentValue: Number(formData.get("currentValue")),
    notes: formData.get("notes"),
  };

  strategies.push(entry);
  saveStrategies();
  strategyForm.reset();
  renderAll();
});

document.querySelectorAll(".period").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".period").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    selectedPeriod = button.dataset.period;
    renderPerformance();
  });
});

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Wirklich alle Strategien löschen?")) return;
  strategies = [];
  saveStrategies();
  renderAll();
});

seedDemoDataBtn.addEventListener("click", () => {
  strategies = [
    {
      id: crypto.randomUUID(),
      name: "ETH Staking",
      category: "staking",
      protocol: "Lido",
      chain: "Ethereum",
      startDate: "2026-01-05",
      invested: 5400,
      currentValue: 5960,
      notes: "Rewards werden reinvestiert",
    },
    {
      id: crypto.randomUUID(),
      name: "USDC Lending",
      category: "lending",
      protocol: "Aave",
      chain: "Arbitrum",
      startDate: "2026-02-02",
      invested: 3000,
      currentValue: 3085,
      notes: "Defensive Strategie",
    },
    {
      id: crypto.randomUUID(),
      name: "BTC Funding Hedge",
      category: "funding-rate-farming",
      protocol: "Hyperliquid",
      chain: "HyperEVM",
      startDate: "2025-11-15",
      invested: 4800,
      currentValue: 4515,
      notes: "Negativer Funding-Zyklus",
    },
  ];

  saveStrategies();
  renderAll();
});

renderAll();
