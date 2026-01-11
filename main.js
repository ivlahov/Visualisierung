// -------------------------
// Globals
// -------------------------
let rows = [];
let currentSort = "desc";

let data2 = [];
let data3 = [];

let chart3Timer = null;

const W = 760;
const H = 380;
const M = { top: 20, right: 20, bottom: 70, left: 70 };

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// -------------------------
// Helpers
// -------------------------
function toNumber(v) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

// -------------------------
// Chart 1: Sortieren
// -------------------------
function sortRows(mode) {
  currentSort = mode;
  if (mode === "desc") rows.sort((a, b) => d3.descending(a.Anzahl, b.Anzahl));
  if (mode === "asc") rows.sort((a, b) => d3.ascending(a.Anzahl, b.Anzahl));
  if (mode === "name") rows.sort((a, b) => d3.ascending(a.Stadt, b.Stadt));
}

// -------------------------
// Chart 1: Balkendiagramm
// -------------------------
function render() {
  d3.select("#chart1").selectAll("*").remove();

  const svg = d3.select("#chart1").append("svg").attr("width", W).attr("height", H);

  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", "600")
    .text("Kebabläden in deutschen Städten");

  const x = d3.scaleBand()
    .domain(rows.map(d => d.Stadt))
    .range([M.left, W - M.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(rows, d => d.Anzahl) ?? 0])
    .nice()
    .range([H - M.bottom, M.top]);

  svg.append("g")
    .attr("transform", `translate(0,${H - M.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-25)")
      .attr("dx", "-0.4em")
      .attr("dy", "0.3em")
    );

  svg.append("g")
    .attr("transform", `translate(${M.left},0)`)
    .call(d3.axisLeft(y).ticks(6));

  svg.append("text")
    .attr("x", -(H / 2))
    .attr("y", 18)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Anzahl Kebabläden");

  svg.append("g")
    .selectAll("rect")
    .data(rows, d => d.Stadt)
    .join("rect")
    .attr("x", d => x(d.Stadt))
    .attr("y", d => y(d.Anzahl))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.Anzahl))
    .attr("fill", "#4e79a7")
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("left", `${event.clientX}px`)
        .style("top", `${event.clientY}px`)
        .text(`${d.Stadt}: ${d.Anzahl}`);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  svg.append("text")
    .attr("x", M.left)
    .attr("y", H - 12)
    .attr("font-size", 12)
    .attr("fill", "#555")
    .text(`Sortierung: ${currentSort}`);
}

// -------------------------
// Chart 2: Gruppiertes Balkendiagramm
// -------------------------
function renderChart2() {
  d3.select("#chart2").selectAll("*").remove();

  const svg = d3.select("#chart2").append("svg").attr("width", W).attr("height", H);

  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", "600")
    .text("Kebabläden in Berlin und Köln über Jahre");

  const grouped = d3.group(data2, d => d.Jahr);
  const years = Array.from(grouped.keys()).sort();
  const cities = ["Berlin", "Köln"];

  const x0 = d3.scaleBand()
    .domain(years)
    .range([M.left, W - M.right])
    .padding(0.2);

  const x1 = d3.scaleBand()
    .domain(cities)
    .range([0, x0.bandwidth()])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data2, d => d["Anzahl Kebabläden"]) ?? 0])
    .nice()
    .range([H - M.bottom, M.top]);

  svg.append("g")
    .attr("transform", `translate(0,${H - M.bottom})`)
    .call(d3.axisBottom(x0));

  svg.append("g")
    .attr("transform", `translate(${M.left},0)`)
    .call(d3.axisLeft(y).ticks(6));

  svg.append("text")
    .attr("x", -(H / 2))
    .attr("y", 18)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Anzahl Kebabläden");

  const barGroups = svg.append("g")
    .selectAll("g")
    .data(years)
    .join("g")
    .attr("transform", d => `translate(${x0(d)},0)`);

  barGroups.selectAll("rect")
    .data(year =>
      cities.map(city => ({
        year,
        city,
        value: grouped.get(year)?.find(item => item.Stadt === city)?.["Anzahl Kebabläden"] ?? 0
      }))
    )
    .join("rect")
    .attr("x", d => x1(d.city))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => y(0) - y(d.value))
    .attr("fill", d => d.city === "Berlin" ? "#4e79a7" : "#f28e2c")
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("left", `${event.clientX}px`)
        .style("top", `${event.clientY}px`)
        .text(`${d.city} ${d.year}: ${d.value}`);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));
}

// -------------------------
// Chart 3: Dynamische Wahrnehmungsgrenze
// -------------------------
function renderChart3() {
  d3.select("#chart3").selectAll("*").remove();

  const svg = d3.select("#chart3").append("svg").attr("width", W).attr("height", H);

  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", "600")
    .text("Dynamische Veränderung (alle 3 Sek.): zufällige Stadt ±Δ");

  const x = d3.scaleBand()
    .domain(data3.map(d => d.Stadt))
    .range([M.left, W - M.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data3, d => d.Anzahl) ?? 0])
    .nice()
    .range([H - M.bottom, M.top]);

  // Gridlines in 200er Schritten
  const step = 200;
  const maxY = y.domain()[1] ?? 0;
  const ticks200 = d3.range(0, maxY + step, step);

  svg.append("g")
    .attr("transform", `translate(${M.left},0)`)
    .attr("opacity", 0.25)
    .call(
      d3.axisLeft(y)
        .tickValues(ticks200)
        .tickSize(-(W - M.left - M.right))
        .tickFormat("")
    )
    .call(g => g.select(".domain").remove());

  svg.append("g")
    .attr("transform", `translate(0,${H - M.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-25)")
      .attr("dx", "-0.4em")
      .attr("dy", "0.3em")
    );

  svg.append("g")
    .attr("transform", `translate(${M.left},0)`)
    .call(d3.axisLeft(y).ticks(6));

  svg.append("g")
    .selectAll("rect")
    .data(data3, d => d.Stadt)
    .join("rect")
    .attr("x", d => x(d.Stadt))
    .attr("y", d => y(d.Anzahl))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.Anzahl))
    .attr("fill", "#59a14f")
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("left", `${event.clientX}px`)
        .style("top", `${event.clientY}px`)
        .text(`${d.Stadt}: ${d.Anzahl}`);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));
}

function applyRandomChangeChart3() {
  if (!data3.length) return;

  const deltaEl = document.getElementById("deltaInput");
  const delta = deltaEl ? Number(deltaEl.value) : 5;

  const idx = Math.floor(Math.random() * data3.length);
  const sign = Math.random() < 0.5 ? -1 : +1;

  const oldVal = data3[idx].Anzahl;
  const newVal = Math.max(0, oldVal + sign * delta);
  data3[idx].Anzahl = newVal;

  const info = document.getElementById("lastChangeInfo");
  if (info) info.textContent = `Letzte Änderung: ${data3[idx].Stadt} ${oldVal} → ${newVal} (Δ=${sign * delta})`;

  renderChart3();
}

function startChart3Timer() {
  stopChart3Timer();
  const intervalEl = document.getElementById("intervalInput");
  const intervalSec = intervalEl ? Number(intervalEl.value) : 3;
  const ms = Math.max(500, intervalSec * 1000);
  chart3Timer = setInterval(applyRandomChangeChart3, ms);
}

function stopChart3Timer() {
  if (chart3Timer) clearInterval(chart3Timer);
  chart3Timer = null;
}

// -------------------------
// MAIN
// -------------------------
async function main() {
  const data1 = await d3.json("./Uebung01_Daten.json");
  data2 = await d3.json("./Uebung02_Daten.json");      // <-- GLOBAL (kein const!)
  const raw3 = await d3.json("./Uebung03_Daten.json"); // <-- lokal

  rows = data1.map(d => ({
    Stadt: String(d.Stadt),
    Anzahl: toNumber(d.Anzahl_Kebabläden)
  })).filter(d => d.Stadt && Number.isFinite(d.Anzahl));

  // Robust für Übung 3
  const sample3 = raw3?.[0] ?? {};
  const keys3 = Object.keys(sample3);

  const cityKey =
    (keys3.includes("Stadt") && "Stadt") ||
    keys3[0];

  const countKey =
    (keys3.includes("Anzahl_Kebabläden") && "Anzahl_Kebabläden") ||
    (keys3.includes("Anzahl Kebabläden") && "Anzahl Kebabläden") ||
    (keys3.includes("Anzahl") && "Anzahl") ||
    keys3[1];

  data3 = raw3.map(d => ({
    Stadt: String(d[cityKey]),
    Anzahl: toNumber(d[countKey])
  })).filter(d => d.Stadt && Number.isFinite(d.Anzahl));

  sortRows("desc");
  render();
  renderChart2();
  renderChart3();

  document.getElementById("sortDesc")?.addEventListener("click", () => { sortRows("desc"); render(); });
  document.getElementById("sortAsc")?.addEventListener("click", () => { sortRows("asc"); render(); });
  document.getElementById("sortName")?.addEventListener("click", () => { sortRows("name"); render(); });

  const deltaInput = document.getElementById("deltaInput");
  const deltaValue = document.getElementById("deltaValue");
  if (deltaInput && deltaValue) {
    deltaValue.textContent = deltaInput.value;
    deltaInput.addEventListener("input", () => {
      deltaValue.textContent = deltaInput.value;
    });
  }

  document.getElementById("startChart3")?.addEventListener("click", startChart3Timer);
  document.getElementById("stopChart3")?.addEventListener("click", stopChart3Timer);
}

// starte sicher
main().catch(err => {
  console.error(err);
  alert("Fehler: Konsole öffnen (F12) und Nachricht kopieren.");
});



async function main() {
  const data1 = await d3.json("./Uebung01_Daten.json");
  data2 = await d3.json("./Uebung02_Daten.json");      // <-- WICHTIG: global befüllen
  const raw3 = await d3.json("./Uebung03_Daten.json"); // <-- raw3 lokal, data3 global

  // Übung 1
  rows = data1.map(d => ({
    Stadt: String(d.Stadt),
    Anzahl: toNumber(d.Anzahl_Kebabläden)
  })).filter(d => d.Stadt && Number.isFinite(d.Anzahl));

  // Übung 3 (Keys können je nach Datei anders heißen -> robust)
  const sample3 = raw3?.[0] ?? {};
  const keys3 = Object.keys(sample3);

  const cityKey =
    (keys3.includes("Stadt") && "Stadt") ||
    (keys3.includes("City") && "City") ||
    (keys3.includes("city") && "city") ||
    keys3[0];

  const countKey =
    (keys3.includes("Anzahl_Kebabläden") && "Anzahl_Kebabläden") ||
    (keys3.includes("Anzahl Kebabläden") && "Anzahl Kebabläden") ||
    (keys3.includes("Anzahl") && "Anzahl") ||
    (keys3.includes("Value") && "Value") ||
    (keys3.includes("value") && "value") ||
    keys3.find(k => typeof sample3[k] === "number") ||
    keys3[1];

  console.log("Ü3 detected keys:", { cityKey, countKey });
  console.log("Ü3 sample:", sample3);

  data3 = raw3
    .map(d => ({
      Stadt: String(d[cityKey]),
      Anzahl: toNumber(d[countKey])
    }))
    .filter(d => d.Stadt && Number.isFinite(d.Anzahl));

  console.log("Ü3 mapped sample:", data3.slice(0, 5));

  // Render initial
  sortRows("desc");
  render();
  renderChart2();
  renderChart3();

  // Buttons Chart 1
  document.getElementById("sortDesc").addEventListener("click", () => { sortRows("desc"); render(); });
  document.getElementById("sortAsc").addEventListener("click", () => { sortRows("asc"); render(); });
  document.getElementById("sortName").addEventListener("click", () => { sortRows("name"); render(); });

  // Controls Chart 3
  const deltaInput = document.getElementById("deltaInput");
  const deltaValue = document.getElementById("deltaValue");
  if (deltaInput && deltaValue) {
    deltaValue.textContent = deltaInput.value;
    deltaInput.addEventListener("input", () => {
      deltaValue.textContent = deltaInput.value;
    });
  }

  document.getElementById("startChart3")?.addEventListener("click", startChart3Timer);
  document.getElementById("stopChart3")?.addEventListener("click", stopChart3Timer);
}

