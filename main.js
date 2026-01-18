// -------------------------
// Globals
// -------------------------
let rows = [];
let currentSort = "desc";

let data2 = [];
let data3 = [];
let data4 = [];

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
function renderChart1() {
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
// Chart 2: Gruppiertes Balkendiagramm (Berlin/Köln über Jahre)
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
    .data(year => cities.map(city => ({
      year,
      city,
      value: grouped.get(year)?.find(item => item.Stadt === city)?.["Anzahl Kebabläden"] ?? 0
    })))
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
// Chart 4: absichtlich schlechtes "3D"-Tortendiagramm
// -------------------------
function renderChart4_Bad3DPies() {
  d3.select("#chart4").selectAll("*").remove();

  const svg = d3.select("#chart4").append("svg").attr("width", W).attr("height", H);

  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", "600")
    .text("Ü4 (absichtlich schlecht): 3D-Torte (Winkel/Fläche) + Regenbogen + Zeit zyklisch");

  if (!data4.length) {
    svg.append("text")
      .attr("x", W / 2)
      .attr("y", H / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#a00")
      .text("Keine Ü4-Daten geladen (Uebung04_Daten.json prüfen).");
    return;
  }

  const byCity = d3.group(data4, d => d.Stadt);
  const cities = Array.from(byCity.keys()).slice(0, 2);

  const centers = [
    { city: cities[0], cx: W * 0.30, cy: H * 0.58 },
    { city: cities[1], cx: W * 0.70, cy: H * 0.58 }
  ];

  const badColor = d3.scaleSequential(d3.interpolateRainbow).domain([0, 1]);

  const radius = 120;
  const depth = 18;

  const pie = d3.pie()
    .sort(null)
    .value(d => d.Verkaeufe);

  const arcTop = d3.arc().innerRadius(0).outerRadius(radius);
  const arcBottom = d3.arc().innerRadius(0).outerRadius(radius);

  centers.forEach((c, ci) => {
    const cityRows = byCity.get(c.city) ?? [];
    const segments = pie(cityRows);

    // Stadt-Label etwas tiefer, damit es nicht mit dem Titel kollidiert
    svg.append("text")
      .attr("x", c.cx)
      .attr("y", 62)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", "600")
      .text(c.city);

    const g = svg.append("g").attr("transform", `translate(${c.cx},${c.cy})`);

    g.append("g")
      .selectAll("path.bottom")
      .data(segments)
      .join("path")
      .attr("d", d => arcBottom(d))
      .attr("transform", `translate(0,${depth})`)
      .attr("fill", (d, i) =>
        d3.color(badColor((i % segments.length) / segments.length))?.darker(0.9)
      )
      .attr("stroke", "none")
      .attr("opacity", 0.95);

    g.append("g")
      .selectAll("path.top")
      .data(segments)
      .join("path")
      .attr("d", d => arcTop(d))
      .attr("fill", (d, i) => badColor((i % segments.length) / segments.length))
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.6)
      .on("mousemove", (event, d) => {
        tooltip
          .style("opacity", 1)
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`)
          .text(`${d.data.Stadt} | Tag ${d.data.Tag} | ${d.data.Zeit}: ${d.data.Verkaeufe}`);
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));

    if (ci === 0) {
      svg.append("text")
        .attr("x", W / 2)
        .attr("y", H - 14)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#555")
        .text("Absichtlich schlecht: Zeit zyklisch im Kreis, Winkel/Fläche statt Position, Regenbogenfarben, Fake-3D.");
    }
  });
}

// -------------------------
// Chart 4.1: gute Visualisierung (Small Multiples + Linien) - FIXED LAYOUT
// -------------------------
function renderChart41_Good() {
  d3.select("#chart41").selectAll("*").remove();

  const svg = d3.select("#chart41").append("svg").attr("width", W).attr("height", H);

  // Titel: höher + kleiner, damit nichts kollidiert
  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", "600")
    .text("Ü4.1 (gut): Verkäufe über 7 Tage, getrennt nach Stadt, Farbe=Zeit");

  if (!data4.length) {
    svg.append("text")
      .attr("x", W / 2)
      .attr("y", H / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#a00")
      .text("Keine Ü4-Daten geladen.");
    return;
  }

  // Extra Platz oben für Titel + Legende
  const TOP_PAD = 42;

  const cities = Array.from(new Set(data4.map(d => d.Stadt))).slice(0, 2);
  const times = ["morgens", "mittags", "abends"];

  const gap = 30;
  const panelW = (W - M.left - M.right - gap) / 2;
  const panelH = H - TOP_PAD - M.bottom;

  const x = d3.scaleLinear()
    .domain([1, 7])
    .range([0, panelW]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data4, d => d.Verkaeufe) ?? 0])
    .nice()
    .range([TOP_PAD + panelH, TOP_PAD]);

  const color = d3.scaleOrdinal()
    .domain(times)
    .range(["#4e79a7", "#f28e2c", "#59a14f"]);

  // Gridlines
  svg.append("g")
    .attr("transform", `translate(${M.left},0)`)
    .attr("opacity", 0.2)
    .call(
      d3.axisLeft(y)
        .ticks(6)
        .tickSize(-(W - M.left - M.right))
        .tickFormat("")
    )
    .call(g => g.select(".domain").remove());

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${M.left},0)`)
    .call(d3.axisLeft(y).ticks(6));

  // Y label
  svg.append("text")
    .attr("x", -(H / 2))
    .attr("y", 18)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Verkäufe");

  const line = d3.line()
    .x(d => x(d.Tag))
    .y(d => y(d.Verkaeufe));

  cities.forEach((city, i) => {
    const xOffset = M.left + i * (panelW + gap);
    const panel = svg.append("g").attr("transform", `translate(${xOffset},0)`);

    // Panel-Titel: unter den Haupttitel setzen
    panel.append("text")
      .attr("x", panelW / 2)
      .attr("y", TOP_PAD - 12)
      .attr("text-anchor", "middle")
      .attr("font-size", 13)
      .attr("font-weight", "600")
      .text(city);

    // X axis per panel
    panel.append("g")
      .attr("transform", `translate(0,${TOP_PAD + panelH})`)
      .call(d3.axisBottom(x).ticks(7).tickFormat(d3.format("d")));

    const cityData = data4.filter(d => d.Stadt === city);

    times.forEach(t => {
      const series = cityData
        .filter(d => d.Zeit === t)
        .sort((a, b) => a.Tag - b.Tag);

      panel.append("path")
        .datum(series)
        .attr("fill", "none")
        .attr("stroke", color(t))
        .attr("stroke-width", 2)
        .attr("d", line);

      panel.append("g")
        .selectAll(`circle.${t}`)
        .data(series)
        .join("circle")
        .attr("r", 3.5)
        .attr("cx", d => x(d.Tag))
        .attr("cy", d => y(d.Verkaeufe))
        .attr("fill", color(t))
        .on("mousemove", (event, d) => {
          tooltip
            .style("opacity", 1)
            .style("left", `${event.clientX}px`)
            .style("top", `${event.clientY}px`)
            .text(`${d.Stadt} | Tag ${d.Tag} | ${d.Zeit}: ${d.Verkaeufe}`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
    });
  });

  // Legend: nach unten verschoben (nicht mehr im Titel)
  // Legend: unten rechts im Plotbereich (kollisionsfrei)
const legendW = 140;
const legendH = 12 + times.length * 18; // grobe Höhe
const legendX = W - M.right - legendW;
const legendY = TOP_PAD + panelH - legendH; // unten im Plot

const legend = svg.append("g")
  .attr("transform", `translate(${legendX}, ${legendY})`);

// optional: weißes Hintergrund-Panel (macht es immer lesbar)
legend.append("rect")
  .attr("x", -10)
  .attr("y", -18)
  .attr("width", legendW)
  .attr("height", legendH + 22)
  .attr("fill", "white")
  .attr("opacity", 0.85);

legend.append("text")
  .attr("x", 0)
  .attr("y", -6)
  .attr("font-size", 12)
  .attr("font-weight", "600")
  .text("Zeit");

times.forEach((t, i) => {
  legend.append("line")
    .attr("x1", 0).attr("x2", 18)
    .attr("y1", i * 18).attr("y2", i * 18)
    .attr("stroke", color(t))
    .attr("stroke-width", 3);

  legend.append("text")
    .attr("x", 24)
    .attr("y", i * 18 + 4)
    .attr("font-size", 12)
    .text(t);
});


  legend.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text("Zeit");

  times.forEach((t, i) => {
    legend.append("line")
      .attr("x1", 0).attr("x2", 18)
      .attr("y1", i * 18).attr("y2", i * 18)
      .attr("stroke", color(t))
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 24)
      .attr("y", i * 18 + 4)
      .attr("font-size", 12)
      .text(t);
  });
}

// -------------------------
// MAIN
// -------------------------
async function main() {
  const data1 = await d3.json("./Uebung01_Daten.json");
  data2 = await d3.json("./Uebung02_Daten.json");
  const raw3 = await d3.json("./Uebung03_Daten.json");
  const raw4 = await d3.json("./Uebung04_Daten.json");

  // Ü1
  rows = data1.map(d => ({
    Stadt: String(d.Stadt),
    Anzahl: toNumber(d.Anzahl_Kebabläden)
  })).filter(d => d.Stadt && Number.isFinite(d.Anzahl));

  // Ü3 (robust)
  const sample3 = raw3?.[0] ?? {};
  const keys3 = Object.keys(sample3);

  const cityKey = (keys3.includes("Stadt") && "Stadt") || keys3[0];
  const countKey =
    (keys3.includes("Anzahl_Kebabläden") && "Anzahl_Kebabläden") ||
    (keys3.includes("Anzahl Kebabläden") && "Anzahl Kebabläden") ||
    (keys3.includes("Anzahl") && "Anzahl") ||
    keys3[1];

  data3 = raw3.map(d => ({
    Stadt: String(d[cityKey]),
    Anzahl: toNumber(d[countKey])
  })).filter(d => d.Stadt && Number.isFinite(d.Anzahl));

  // Ü4 (fixe Keys)
  data4 = raw4.map(d => ({
    Stadt: String(d.Stadt),
    Tag: Number(d.Tag),
    Zeit: String(d.Zeit),
    Verkaeufe: toNumber(d["Verkäufe"])
  })).filter(d => d.Stadt && Number.isFinite(d.Tag) && d.Zeit && Number.isFinite(d.Verkaeufe));

  // Render
  sortRows("desc");
  renderChart1();
  renderChart2();
  renderChart3();
  renderChart4_Bad3DPies();
  renderChart41_Good();

  // Buttons Chart 1
  document.getElementById("sortDesc")?.addEventListener("click", () => { sortRows("desc"); renderChart1(); });
  document.getElementById("sortAsc")?.addEventListener("click", () => { sortRows("asc"); renderChart1(); });
  document.getElementById("sortName")?.addEventListener("click", () => { sortRows("name"); renderChart1(); });

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

// Start
main().catch(err => {
  console.error(err);
  alert("Fehler: Konsole öffnen (F12) und Nachricht kopieren.");
});
