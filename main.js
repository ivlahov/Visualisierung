let rows = [];
let currentSort = "desc";

const W = 760;
const H = 380;
const M = { top: 20, right: 20, bottom: 70, left: 70 };

const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

function sortRows(mode) {
  currentSort = mode;
  if (mode === "desc") rows.sort((a, b) => d3.descending(a.Anzahl, b.Anzahl));
  if (mode === "asc") rows.sort((a, b) => d3.ascending(a.Anzahl, b.Anzahl));
  if (mode === "name") rows.sort((a, b) => d3.ascending(a.Stadt, b.Stadt));
}

function render() {
  d3.select("#chart").selectAll("*").remove();

  const svg = d3.select("#chart").append("svg").attr("width", W).attr("height", H);
  
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

  // Achsen
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

  // Y-Label
  svg.append("text")
    .attr("x", -(H / 2))
    .attr("y", 18)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Anzahl Kebabläden");

  // Balken
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

  // Werte (optional)
  svg.append("g")
    .selectAll("text.value")
    .data(rows, d => d.Stadt)
    .join("text")
    .attr("class", "value")
    .attr("x", d => (x(d.Stadt) ?? 0) + x.bandwidth() / 2)
    .attr("y", d => y(d.Anzahl) - 6)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text(d => d.Anzahl);

  // Kleine Legende/Info
  svg.append("text")
    .attr("x", M.left)
    .attr("y", H - 12)
    .attr("font-size", 12)
    .attr("fill", "#555")
    .text(`Sortierung: ${currentSort}`);
}

async function main() {
  const data = await d3.json("./Uebung01_Daten.json");

  // Erwartete Keys: Stadt, Anzahl_Kebabläden
  rows = data.map(d => ({
    Stadt: String(d.Stadt),
    Anzahl: Number(d.Anzahl_Kebabläden)
  }));

  // Startsortierung: absteigend
  sortRows("desc");
  render();

  // Buttons
  document.getElementById("sortDesc").addEventListener("click", () => { sortRows("desc"); render(); });
  document.getElementById("sortAsc").addEventListener("click", () => { sortRows("asc"); render(); });
  document.getElementById("sortName").addEventListener("click", () => { sortRows("name"); render(); });
}

main().catch(err => {
  console.error(err);
  alert("Fehler: Konsole öffnen (F12) und Nachricht kopieren.");
});
