let payload;
const money = v => v == null ? '—' : new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
const num = v => v == null ? '—' : new Intl.NumberFormat('es-EC').format(v);
const pct = v => v == null ? '—' : `${v>0?'+':''}${v.toFixed(2)}%`;
const cls = v => v == null ? '' : v > 0 ? 'positive' : v < 0 ? 'negative' : 'neutral';

async function init(){
  payload = await fetch('data/target_landing.json').then(r=>r.json());
  renderStats(); renderAvailability(); renderSummary(); renderCompanyCards();
}
function latest(c){ return c.latest || c.years.find(y=>y.available) || {}; }
function variation(c, from, to){ return c.variations.find(v=>v.from===from && v.to===to) || {metrics:{}}; }
function latestVariation(c){ const l=latest(c); return l.year===2025 ? variation(c,2024,2025) : variation(c,2023,2024); }
function renderStats(){
  const companies = payload.companies;
  const sales = companies.reduce((s,c)=>s+(latest(c).sales||0),0);
  const assets = companies.reduce((s,c)=>s+(latest(c).assets||0),0);
  const employees = companies.reduce((s,c)=>s+(latest(c).employees||0),0);
  const with2025 = companies.filter(c => c.years.some(y=>y.year===2025 && y.available)).length;
  document.getElementById('targetStats').innerHTML = [
    ['Compañías analizadas', num(companies.length)],
    ['Ventas último año', money(sales)],
    ['Activos último año', money(assets)],
    ['Con datos 2025', `${with2025}/${companies.length}`]
  ].map(([l,v])=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
}
function renderAvailability(){
  const a=payload.summary.availability;
  const label = v => v===true ? 'Disponible' : v==='partial' ? 'Parcial' : 'No disponible';
  document.getElementById('availability').innerHTML = `<h2>Disponibilidad de información</h2><p>${payload.summary.note}</p><div class="year-pills">
    ${Object.keys(a).map(y=>`<span class="pill ${a[y]===true?'ok':a[y]==='partial'?'partial':'pending'}">${y}: ${label(a[y])}</span>`).join('')}
  </div>`;
}
function renderSummary(){
  document.getElementById('summaryBody').innerHTML = payload.companies.map(c=>{
    const l=latest(c), v2524=variation(c,2024,2025).metrics || {}, v2423=variation(c,2023,2024).metrics || {};
    return `<tr>
      <td><a href="#${slug(c.name)}" class="company-name">${c.name}</a><br><small>${l.ciiu||''}</small></td>
      <td>${l.year || '—'}</td><td>${money(l.sales)}</td>
      <td class="${cls(v2524.sales?.pct)}">${pct(v2524.sales?.pct)}</td>
      <td class="${cls(v2423.sales?.pct)}">${pct(v2423.sales?.pct)}</td>
      <td>${money(l.assets)}</td><td>${num(l.employees)}</td><td>${money(l.netProfit)}</td>
      <td class="${cls(v2524.netProfit?.pct)}">${pct(v2524.netProfit?.pct)}</td>
    </tr>`;
  }).join('');
}
function slug(s){return (s||'').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi,'-')}
function metric(label, value, variation, suffix){
  const p = variation?.pct;
  return `<div class="metric"><span>${label}</span><b>${value}</b>${p==null?'':`<em class="${cls(p)}">${pct(p)} ${suffix}</em>`}</div>`;
}
function yearlyRows(c){
  return c.years.map(y=>`<tr><td>${y.year}</td>${y.available ? `<td>${num(y.rank)}</td><td>${money(y.sales)}</td><td>${money(y.assets)}</td><td>${num(y.employees)}</td><td>${money(y.netProfit)}</td>` : `<td colspan="5"><span class="muted">${y.note}</span></td>`}</tr>`).join('');
}
function renderCompanyCards(){
  document.getElementById('companies').innerHTML = payload.companies.map(c=>{
    const l=latest(c), lv=latestVariation(c).metrics || {}, suffix = l.year===2025 ? 'vs 2024' : 'vs 2023';
    const v2423=variation(c,2023,2024).metrics || {}, v2524=variation(c,2024,2025).metrics || {};
    const wi=c.webIntel || {};
    const offerings=(wi.offerings||[]).map(o=>`<span>${o}</span>`).join('');
    return `<article class="company-card" id="${slug(c.name)}">
      <div class="company-head"><div><p class="eyebrow">${l.ciiu||'—'} · último dato ${l.year||'—'}</p><h2>${c.name}</h2><p>${l.source || payload.summary.source}</p></div><div class="rank-badge">#${l.rank||'—'}<span>Rank ${l.year||''}</span></div></div>
      ${wi.description ? `<div class="web-intel"><div><h3>Principales offerings</h3><p>${wi.description}</p>${wi.website?`<a href="${wi.website}" target="_blank" rel="noopener">Sitio / fuente</a>`:''}<small>Confianza: ${wi.confidence||'—'}</small></div><div class="offering-tags">${offerings}</div></div>` : ''}
      <div class="detail-grid">
        ${metric(`Ventas ${l.year||''}`, money(l.sales), lv.sales, suffix)}
        ${metric(`Activos ${l.year||''}`, money(l.assets), lv.assets, suffix)}
        ${metric(`Empleados ${l.year||''}`, num(l.employees), lv.employees, suffix)}
        ${metric(`Utilidad neta ${l.year||''}`, money(l.netProfit), lv.netProfit, suffix)}
      </div>
      <div class="variance-strip">
        <span>Ventas 24/23: <b class="${cls(v2423.sales?.pct)}">${pct(v2423.sales?.pct)}</b></span>
        <span>Ventas 25/24: <b class="${cls(v2524.sales?.pct)}">${pct(v2524.sales?.pct)}</b></span>
        <span>Utilidad 24/23: <b class="${cls(v2423.netProfit?.pct)}">${pct(v2423.netProfit?.pct)}</b></span>
        <span>Utilidad 25/24: <b class="${cls(v2524.netProfit?.pct)}">${pct(v2524.netProfit?.pct)}</b></span>
      </div>
      <div class="table-wrap mini"><table><thead><tr><th>Año</th><th>Rank</th><th>Ventas</th><th>Activos</th><th>Empleados</th><th>Utilidad neta</th></tr></thead><tbody>${yearlyRows(c)}</tbody></table></div>
    </article>`;
  }).join('');
}
init();
