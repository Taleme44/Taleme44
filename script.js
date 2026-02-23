const form = document.getElementById('calculator');
const errorMessage = document.getElementById('errorMessage');

const fields = {
  capital: document.getElementById('capital'),
  lowerPrice: document.getElementById('lowerPrice'),
  upperPrice: document.getElementById('upperPrice'),
  grids: document.getElementById('grids'),
  leverage: document.getElementById('leverage'),
  fee: document.getElementById('fee'),
  executions: document.getElementById('executions')
};

const output = {
  gridSpacing: document.getElementById('gridSpacing'),
  orderSize: document.getElementById('orderSize'),
  grossProfit: document.getElementById('grossProfit'),
  netProfit: document.getElementById('netProfit'),
  dailyProfit: document.getElementById('dailyProfit'),
  roi: document.getElementById('roi'),
  levelsList: document.getElementById('levelsList')
};

const fmt = (num, digits = 2) =>
  new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(num);

const parseField = (input) => Number(input.value.replace(',', '.'));

function setDeltaColor(el, value) {
  el.classList.remove('positive', 'negative');
  el.classList.add(value >= 0 ? 'positive' : 'negative');
}

function showError(text) {
  errorMessage.textContent = text;
}

function clearError() {
  errorMessage.textContent = '';
}

function calculate(event) {
  event?.preventDefault();

  const capital = parseField(fields.capital);
  const lower = parseField(fields.lowerPrice);
  const upper = parseField(fields.upperPrice);
  const grids = parseField(fields.grids);
  const leverage = parseField(fields.leverage);
  const feePercent = parseField(fields.fee) / 100;
  const executions = parseField(fields.executions);

  if ([capital, lower, upper, grids, leverage, feePercent, executions].some(Number.isNaN)) {
    showError('Bitte nur gültige Zahlen eingeben.');
    return;
  }

  if (upper <= lower || grids < 2 || capital <= 0 || leverage < 1 || executions < 1) {
    showError('Bitte Eingaben prüfen: obere Grenze > untere, Grids ≥ 2, Kapital > 0.');
    return;
  }

  clearError();

  const effectiveCapital = capital * leverage;
  const priceRange = upper - lower;
  const gridSpacing = priceRange / grids;
  const orderSize = effectiveCapital / grids;

  const avgPrice = (lower + upper) / 2;
  const grossProfitPerGrid = (gridSpacing / avgPrice) * orderSize;
  const feeCostPerGrid = orderSize * feePercent * 2;
  const netProfitPerGrid = grossProfitPerGrid - feeCostPerGrid;
  const estimatedDailyProfit = netProfitPerGrid * executions;
  const roiPerDay = (estimatedDailyProfit / capital) * 100;

  output.gridSpacing.textContent = `${fmt(gridSpacing, 2)} USDT`;
  output.orderSize.textContent = `${fmt(orderSize, 2)} USDT`;
  output.grossProfit.textContent = `${fmt(grossProfitPerGrid, 2)} USDT`;
  output.netProfit.textContent = `${fmt(netProfitPerGrid, 2)} USDT`;
  output.dailyProfit.textContent = `${fmt(estimatedDailyProfit, 2)} USDT`;
  output.roi.textContent = `${fmt(roiPerDay, 2)} %`;

  setDeltaColor(output.netProfit, netProfitPerGrid);
  setDeltaColor(output.dailyProfit, estimatedDailyProfit);
  setDeltaColor(output.roi, roiPerDay);

  output.levelsList.innerHTML = '';
  for (let i = 0; i < Math.min(grids + 1, 12); i += 1) {
    const li = document.createElement('li');
    const levelPrice = lower + gridSpacing * i;
    li.textContent = `Grid ${i + 1}: ${fmt(levelPrice, 2)} USDT`;
    output.levelsList.appendChild(li);
  }
}

form.addEventListener('submit', calculate);
Object.values(fields).forEach((field) => {
  field.addEventListener('input', calculate);
});

calculate();
