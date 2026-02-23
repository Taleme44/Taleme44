const form = document.getElementById('calculator');
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

function setDeltaColor(el, value) {
  el.classList.remove('positive', 'negative');
  el.classList.add(value >= 0 ? 'positive' : 'negative');
}

function calculate(event) {
  event?.preventDefault();

  const capital = Number(fields.capital.value);
  const lower = Number(fields.lowerPrice.value);
  const upper = Number(fields.upperPrice.value);
  const grids = Number(fields.grids.value);
  const leverage = Number(fields.leverage.value);
  const feePercent = Number(fields.fee.value) / 100;
  const executions = Number(fields.executions.value);

  if (upper <= lower || grids < 2 || capital <= 0 || leverage < 1) {
    alert('Bitte prüfe die Eingaben. Obere Grenze muss größer als untere sein.');
    return;
  }

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
calculate();
