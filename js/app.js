let companies = [];
let stats = {};
const money = v => v == null ? '—' : new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
const num = v => v == null ? '—' : new Intl.NumberFormat('es-EC').format(v);

async function init(){
  [companies, stats] = await Promise.all([
    fetch('data/companies.json').then(r=>r.json()),
    fetch('data/stats.json').then(r=>r.json())
  ]);
  renderStats(); setupFilters(); renderRanking(); renderOpportunity(); renderBars();
}
function renderStats(){
  document.getElementById('stats').innerHTML = [
    ['Empresas analizadas', num(stats.companies)],
    ['Ventas acumuladas', money(stats.totalSales)],
    ['Activos acumulados', money(stats.totalAssets)],
    ['Alta oportunidad', num(stats.highOpportunity)]
  ].map(([label,value])=>`<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('');
}
function setupFilters(){
  const provinces = [...new Set(companies.map(c=>c.province).filter(Boolean))].sort();
  document.getElementById('provinceFilter').innerHTML += provinces.map(p=>`<option>${p}</option>`).join('');
  ['search','provinceFilter','opportunityFilter'].forEach(id=>document.getElementById(id).addEventListener('input', renderRanking));
}
function filtered(){
  const q = document.getElementById('search').value.toLowerCase().trim();
  const p = document.getElementById('provinceFilter').value;
  const o = document.getElementById('opportunityFilter').value;
  return companies.filter(c => (!p || c.province===p) && (!o || c.opportunity===o) && (!q || [c.name,c.ruc,c.province,c.sector,c.ciiu,c.activity].join(' ').toLowerCase().includes(q)));
}
function renderRanking(){
  const rows = filtered().slice(0,250);
  document.getElementById('rankingBody').innerHTML = rows.map(c=>`<tr>
    <td>${c.rank}</td>
    <td><div class="company-name" onclick="showCompany('${c.slug}')">${c.name}</div><small>${c.ruc || 'Exp. '+c.expediente}</small></td>
    <td>${c.province || '—'}</td><td>${c.ciiu || '—'}<br><small>${(c.activity||'').slice(0,80)}</small></td>
    <td>${money(c.sales)}</td><td>${money(c.assets)}</td><td>${num(c.employees)}</td><td>${money(c.netProfit)}</td>
    <td><span class="badge ${c.opportunity}">${c.opportunity} · ${c.opportunityScore}</span></td>
  </tr>`).join('');
}
function renderOpportunity(){
  const top = [...companies].sort((a,b)=>b.opportunityScore-a.opportunityScore || a.rank-b.rank).slice(0,12);
  document.getElementById('opportunityList').innerHTML = top.map(c=>`<div class="company-item" onclick="showCompany('${c.slug}')"><div><strong>${c.name}</strong><br><small>${c.province} · ${c.ciiu} · ${money(c.sales)}</small></div><div class="score">${c.opportunityScore}</div></div>`).join('');
}
function renderBars(){
  barChart('provinceBars', stats.topProvinces);
  barChart('sectorBars', stats.topSectors);
}
function barChart(id, items){
  const max = Math.max(...items.map(x=>x[1]));
  document.getElementById(id).innerHTML = items.map(([label,value])=>`<div class="bar-row"><div class="bar-label"><span>${label}</span><b>${value}</b></div><div class="bar"><div style="width:${value/max*100}%"></div></div></div>`).join('');
}
window.showCompany = function(slug){
  const c = companies.find(x=>x.slug===slug); if(!c) return;
  document.getElementById('companyDetail').classList.remove('empty');
  document.getElementById('companyDetail').innerHTML = `<h3>${c.name}</h3><p>${c.activity || ''}</p><div class="detail-grid">
    <div class="metric"><span>RUC</span><b>${c.ruc || '—'}</b></div><div class="metric"><span>Provincia</span><b>${c.province || '—'}</b></div>
    <div class="metric"><span>Ventas 2024</span><b>${money(c.sales)}</b></div><div class="metric"><span>Activos</span><b>${money(c.assets)}</b></div>
    <div class="metric"><span>Empleados</span><b>${num(c.employees)}</b></div><div class="metric"><span>Utilidad neta</span><b>${money(c.netProfit)}</b></div>
    <div class="metric"><span>Score oportunidad</span><b>${c.opportunity} · ${c.opportunityScore}/100</b></div><div class="metric"><span>Ranking</span><b>#${c.rank}</b></div>
  </div>`;
  location.hash = 'opportunity';
}
init();
