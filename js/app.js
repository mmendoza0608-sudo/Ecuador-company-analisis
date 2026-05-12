let payload;
const money = v => v == null ? '—' : new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
const num = v => v == null ? '—' : new Intl.NumberFormat('es-EC').format(v);
const pct = v => v == null ? '—' : `${v>0?'+':''}${v.toFixed(2)}%`;
const cls = v => v == null ? '' : v > 0 ? 'positive' : v < 0 ? 'negative' : 'neutral';

async function init(){
  payload = await fetch('data/target_landing.json').then(r=>r.json());
  renderStats(); renderAvailability(); renderSummary(); renderCompanyCards();
}
function latest(c){ return c.latest || c.years.find(y=>y.year===2024) || {}; }
function yoy(c){ return c.variations.find(v=>v.from===2023 && v.to===2024) || {}; }
function renderStats(){
  const companies = payload.companies;
  const sales = companies.reduce((s,c)=>s+(latest(c).sales||0),0);
  const assets = companies.reduce((s,c)=>s+(latest(c).assets||0),0);
  const employees = companies.reduce((s,c)=>s+(latest(c).employees||0),0);
  const grew = companies.filter(c => (yoy(c).metrics?.sales?.pct || 0) > 0).length;
  document.getElementById('targetStats').innerHTML = [
    ['Compañías analizadas', num(companies.length)],
    ['Ventas 2024 acumuladas', money(sales)],
    ['Activos 2024 acumulados', money(assets)],
    ['Crecieron en ventas', `${grew}/${companies.length}`]
  ].map(([l,v])=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
}
function renderAvailability(){
  const a=payload.summary.availability;
  document.getElementById('availability').innerHTML = `<h2>Disponibilidad de información</h2><p>${payload.summary.note}</p><div class="year-pills">
    ${Object.keys(a).map(y=>`<span class="pill ${a[y]?'ok':'pending'}">${y}: ${a[y]?'Disponible':'No publicado'}</span>`).join('')}
  </div>`;
}
function renderSummary(){
  document.getElementById('summaryBody').innerHTML = payload.companies.map(c=>{
    const l=latest(c), v=yoy(c).metrics || {}, sales=v.sales||{}, profit=v.netProfit||{};
    return `<tr>
      <td><a href="#${l.expediente}" class="company-name">${c.name}</a><br><small>${l.ciiu||''}</small></td>
      <td>${l.ruc||'—'}</td><td>${l.province||'—'}</td><td>${money(l.sales)}</td>
      <td class="${cls(sales.pct)}">${pct(sales.pct)}</td><td>${money(l.assets)}</td><td>${num(l.employees)}</td><td>${money(l.netProfit)}</td>
      <td class="${cls(profit.pct)}">${pct(profit.pct)}</td>
    </tr>`;
  }).join('');
}
function metric(label, value, variation){
  const p = variation?.pct;
  return `<div class="metric"><span>${label}</span><b>${value}</b>${p==null?'':`<em class="${cls(p)}">${pct(p)} vs 2023</em>`}</div>`;
}
function yearlyRows(c){
  return c.years.map(y=>`<tr><td>${y.year}</td>${y.available ? `<td>${num(y.rank)}</td><td>${money(y.sales)}</td><td>${money(y.assets)}</td><td>${num(y.employees)}</td><td>${money(y.netProfit)}</td>` : `<td colspan="5"><span class="muted">${y.note}</span></td>`}</tr>`).join('');
}
function renderCompanyCards(){
  document.getElementById('companies').innerHTML = payload.companies.map(c=>{
    const l=latest(c), v=yoy(c).metrics || {};
    return `<article class="company-card" id="${l.expediente||c.name}">
      <div class="company-head"><div><p class="eyebrow">${l.province||'—'} · ${l.ciiu||'—'}</p><h2>${c.name}</h2><p>${l.activity||''}</p></div><div class="rank-badge">#${l.rank||'—'}<span>SCVS 2024</span></div></div>
      <div class="detail-grid">
        ${metric('Ventas 2024', money(l.sales), v.sales)}
        ${metric('Activos 2024', money(l.assets), v.assets)}
        ${metric('Empleados 2024', num(l.employees), v.employees)}
        ${metric('Utilidad neta 2024', money(l.netProfit), v.netProfit)}
      </div>
      <div class="table-wrap mini"><table><thead><tr><th>Año</th><th>Rank</th><th>Ventas</th><th>Activos</th><th>Empleados</th><th>Utilidad neta</th></tr></thead><tbody>${yearlyRows(c)}</tbody></table></div>
    </article>`;
  }).join('');
}
init();
