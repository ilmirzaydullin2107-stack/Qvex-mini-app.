
/* =========================
   QVEX 2.0 — APPLICATION
========================= */

"use strict";

/* TELEGRAM */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  try {
    tg.setHeaderColor("#07080d");
    tg.setBackgroundColor("#07080d");
  } catch (error) {
    console.log("Telegram theme unavailable");
  }
}

/* USER PROFILE */

const user = tg?.initDataUnsafe?.user;
const username = document.getElementById("username");

if (username) {
  username.textContent = user
    ? [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ") || "Пользователь Telegram"
    : "Гостевой режим";
}

/* PAGE NAVIGATION */

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll("nav button");

function showPage(pageId) {
  const target = document.getElementById(pageId);

  if (!target || !target.classList.contains("page")) {
    return;
  }

  pages.forEach(page => {
    page.classList.toggle(
      "active",
      page.id === pageId
    );
  });

  navButtons.forEach(button => {
    const active = button.dataset.page === pageId;

    button.classList.toggle("active", active);

    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (pageId === "home") {
    requestAnimationFrame(resizeChart);
  }
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

/* CURRENCY FORMAT */

const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/* BALANCE — NO FAKE MONEY */

const balance = document.getElementById("balance");

if (balance) {
  balance.textContent = rub.format(0);
}

/* PROFIT CALCULATOR */

const calcButton = document.getElementById("calc");

function calculate() {
  const amountInput = document.getElementById("amount");
  const percentInput = document.getElementById("percent");
  const result = document.getElementById("result");

  if (!amountInput || !percentInput || !result) {
    return;
  }

  const amount = Number(amountInput.value);
  const percent = Number(percentInput.value);

  if (
    amountInput.value.trim() === "" ||
    percentInput.value.trim() === "" ||
    !Number.isFinite(amount) ||
    !Number.isFinite(percent) ||
    amount <= 0
  ) {
    result.style.color = "#ff5575";
    result.textContent = "Введите корректные значения";
    return;
  }

  const profit = amount * percent / 100;
  const total = amount + profit;

  result.style.color =
    profit >= 0 ? "#00e59b" : "#ff5575";

  result.textContent =
    "Изменение: " + rub.format(profit) +
    " | Итог: " + rub.format(total);
}

calcButton?.addEventListener("click", calculate);

/* DEMONSTRATION MARKET TICKER */

const demoAssets = [
  {
    symbol: "BTC/USDT",
    price: 68432.12,
    change: 2.45
  },
  {
    symbol: "ETH/USDT",
    price: 3248.76,
    change: 3.21
  },
  {
    symbol: "SOL/USDT",
    price: 162.43,
    change: 1.87
  },
  {
    symbol: "BNB/USDT",
    price: 587.12,
    change: 1.34
  }
];

const ticker = document.getElementById("ticker");

function createTicker() {
  if (!ticker) return;

  ticker.innerHTML = "";

  // Duplicate the list for seamless scrolling.
  const assets = [...demoAssets, ...demoAssets];

  assets.forEach(asset => {
    const item = document.createElement("div");

    item.className = "ticker-item";

    const name = document.createElement("strong");
    name.textContent = asset.symbol;

    const price = document.createElement("span");
    price.textContent = asset.price.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

    const change = document.createElement("span");
    change.textContent = "+" + asset.change.toFixed(2) + "%";

    item.append(name, price, change);
    ticker.appendChild(item);
  });
}

createTicker();

/* =========================
   ANIMATED CANDLESTICK CHART
   SIMULATED DATA ONLY
========================= */

const canvas = document.getElementById("chart");
const ctx = canvas?.getContext("2d");

const quote = document.getElementById("quote");

let candles = [];
let animationFrame = null;
let currentPeriod = "1m";
let lastCandleUpdate = 0;

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const chartConfig = {
  "1m": 36,
  "5m": 30,
  "15m": 25,
  "1h": 20
};

let chartWidth = 0;
let chartHeight = 0;

/* GENERATE DEMO CANDLES */

function generateCandles(period = "1m") {
  const count = chartConfig[period] || 30;

  const data = [];

  let price = 68432;

  for (let i = 0; i < count; i++) {
    const open = price;

    const movement = (Math.random() - 0.48) * 180;

    const close = Math.max(100, open + movement);

    const high =
      Math.max(open, close) + Math.random() * 85;

    const low =
      Math.min(open, close) - Math.random() * 85;

    data.push({
      open,
      high,
      low,
      close
    });

    price = close;
  }

  return data;
}

/* CANVAS RESIZE */

function resizeChart() {
  if (!canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) return;

  const dpr = Math.min(
    window.devicePixelRatio || 1,
    2
  );

  chartWidth = rect.width;
  chartHeight = rect.height;

  canvas.width = Math.round(chartWidth * dpr);
  canvas.height = Math.round(chartHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawChart();
}

/* DRAW CANDLES */

function drawChart() {
  if (!ctx || !candles.length) return;

  const w = chartWidth;
  const h = chartHeight;

  if (!w || !h) return;

  ctx.clearRect(0, 0, w, h);

  const padding = {
    top: 18,
    bottom: 25,
    left: 12,
    right: 12
  };

  const plotHeight =
    h - padding.top - padding.bottom;

  const plotWidth =
    w - padding.left - padding.right;

  const highest = Math.max(
    ...candles.map(c => c.high)
  );

  const lowest = Math.min(
    ...candles.map(c => c.low)
  );

  const range = Math.max(highest - lowest, 1);

  const max = highest + range * 0.12;
  const min = lowest - range * 0.12;

  function y(price) {
    return padding.top +
      (max - price) / (max - min) * plotHeight;
  }

  /* GRID */

  ctx.strokeStyle = "rgba(110,140,180,0.12)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const gy =
      padding.top + plotHeight * i / 4;

    ctx.beginPath();
    ctx.moveTo(padding.left, gy);
    ctx.lineTo(w - padding.right, gy);
    ctx.stroke();
  }

  for (let i = 0; i <= 5; i++) {
    const gx =
      padding.left + plotWidth * i / 5;

    ctx.beginPath();
    ctx.moveTo(gx, padding.top);
    ctx.lineTo(gx, h - padding.bottom);
    ctx.stroke();
  }

  /* CANDLES */

  const step = plotWidth / candles.length;
  const candleWidth = Math.max(
    2,
    Math.min(step * 0.6, 13)
  );

  candles.forEach((candle, index) => {
    const x =
      padding.left + step * index + step / 2;

    const rising = candle.close >= candle.open;

    const color = rising
      ? "#00e59b"
      : "#ff3157";

    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.lineWidth = 1.4;

    // Wick
    ctx.beginPath();
    ctx.moveTo(x, y(candle.high));
    ctx.lineTo(x, y(candle.low));
    ctx.stroke();

    // Candle body
    const top = Math.min(
      y(candle.open),
      y(candle.close)
    );

    const bottom = Math.max(
      y(candle.open),
      y(candle.close)
    );

    const bodyHeight = Math.max(
      bottom - top,
      1.5
    );

    ctx.fillRect(
      x - candleWidth / 2,
      top,
      candleWidth,
      bodyHeight
    );
  });

  /* LAST PRICE LINE */

  const last = candles[candles.length - 1];

  const lastY = y(last.close);

  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#00e59b77";

  ctx.beginPath();
  ctx.moveTo(padding.left, lastY);
  ctx.lineTo(w - padding.right, lastY);
  ctx.stroke();

  ctx.setLineDash([]);

  /* QUOTE */

  if (quote) {
    quote.textContent = last.close.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

    quote.style.color =
      last.close >= last.open
        ? "#00e59b"
        : "#ff3157";
  }
}

/* ANIMATION LOOP */

function animateChart(timestamp) {
  if (!lastCandleUpdate) {
    lastCandleUpdate = timestamp;
  }

  // Simulate a small price movement every 900ms.
  if (timestamp - lastCandleUpdate >= 900) {
    const last = candles[candles.length - 1];

    if (last) {
      last.close = Math.max(
        100,
        last.close + (Math.random() - 0.5) * 95
      );

      last.high = Math.max(
        last.high,
        last.close
      );

      last.low = Math.min(
        last.low,
        last.close
      );

      drawChart();
    }

    lastCandleUpdate = timestamp;
  }

  animationFrame = requestAnimationFrame(
    animateChart
  );
}

/* PERIOD BUTTONS */

document.querySelectorAll("[data-period]").forEach(button => {
  button.addEventListener("click", () => {
    currentPeriod = button.dataset.period;

    document.querySelectorAll(
      "[data-period]"
    ).forEach(item => {
      item.classList.toggle(
        "selected",
        item === button
      );
    });

    candles = generateCandles(currentPeriod);

    drawChart();
  });
});

/* START CHART */

function startChart() {
  if (!canvas || !ctx) return;

  candles = generateCandles(currentPeriod);

  resizeChart();

  if (!reduceMotion && animationFrame === null) {
    animationFrame = requestAnimationFrame(
      animateChart
    );
  }
}

window.addEventListener("resize", resizeChart);

document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    } else {
      lastCandleUpdate = 0;

      if (!reduceMotion && animationFrame === null) {
        animationFrame = requestAnimationFrame(
          animateChart
        );
      }
    }
  }
);

startChart();

/* =========================
   QVEX READY
========================= */

console.log("QVEX 2.0 initialized");
console.log("Market data: DEMONSTRATION ONLY");
