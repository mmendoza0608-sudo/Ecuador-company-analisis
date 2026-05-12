let companies = [];
let stats = {};
let targets = {matches: [], missing: []};
const money = v => v == null ? '—' : new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
const num = v => v == null ? '—' : new Intl.NumberFormat('es-EC').format(v);

async function init(){
  [companies, stats, targets] = await Promise.all([
    fetch('data/companies.json').then(r=>r.json()),
    fetch('data/stats.json').then(r=>r.json()),
    fetch('data/targets.json').then(r=>r.json()).catch(()=>({matches: [], missing: []}))
  ]);
  renderStats(); setupFilters(); renderRanking(); renderOpportunity(); renderTargets(); renderBars();
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
function renderTargets(){
  const body = document.getElementById('targetsBody');
  if(!body) return;
  body.innerHTML = (targets.matches || []).map(c=>`<tr>
    <td>${c.rank || '—'}</td>
    <td><div class="company-name" onclick="showTarget('${c.expediente}')">${c.name}</div><small>${(c.activity||'').slice(0,90)}</small></td>
    <td>${c.ruc || '—'}</td><td>${c.province || '—'}</td><td>${c.ciiu || '—'}</td>
    <td>${money(c.sales)}</td><td>${money(c.assets)}</td><td>${num(c.employees)}</td><td>${money(c.netProfit)}</td>
  </tr>`).join('');
}
function renderBars(){
  barChart('provinceBars', stats.topProvinces);
  barChart('sectorBars', stats.topSectors);
}
function barChart(id, items){
  const max = Math.max(...items.map(x=>x[1]));
  document.getElementById(id).innerHTML = items.map(([label,value])=>`<div class="bar-row"><div class="bar-label"><span>${label}</span><b>${value}</b></div><div class="bar"><div style="width:${value/max*100}%"></div></div></div>`).join('');
}
function renderDetail(c){
  document.getElementById('companyDetail').classList.remove('empty');
  const score = c.opportunityScore != null ? `${c.opportunity} · ${c.opportunityScore}/100` : 'Pendiente';
  document.getElementById('companyDetail').innerHTML = `<h3>${c.name}</h3><p>${c.activity || ''}</p><div class="detail-grid">
    <div class="metric"><span>RUC</span><b>${c.ruc || '—'}</b></div><div class="metric"><span>Provincia</span><b>${c.province || '—'}</b></div>
    <div class="metric"><span>Ventas 2024</span><b>${money(c.sales)}</b></div><div class="metric"><span>Activos</span><b>${money(c.assets)}</b></div>
    <div class="metric"><span>Empleados</span><b>${num(c.employees)}</b></div><div class="metric"><span>Utilidad neta</span><b>${money(c.netProfit)}</b></div>
    <div class="metric"><span>Score oportunidad</span><b>${score}</b></div><div class="metric"><span>Ranking SCVS</span><b>#${c.rank}</b></div>
  </div>`;
  location.hash = 'opportunity';
}
window.showCompany = function(slug){
  const c = companies.find(x=>x.slug===slug); if(c) renderDetail(c);
}
window.showTarget = function(expediente){
  const c = (targets.matches || []).find(x=>x.expediente===expediente); if(c) renderDetail(c);
}
init();
