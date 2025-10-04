// ---------- Config ----------
const GOAL = 75; // change if you want
document.getElementById('goal').textContent = GOAL;

// ---------- State (restored from localStorage) ----------
const state = JSON.parse(localStorage.getItem('summit-state') || '{}');
if (!state.attendees) state.attendees = [];   // [{name, team}]
if (!state.counts) state.counts = { water:0, netzero:0, renew:0 };
save();

const els = {
  form: document.getElementById('checkinForm'),
  name: document.getElementById('name'),
  team: document.getElementById('team'),
  greeting: document.getElementById('greeting'),
  total: document.getElementById('total'),
  water: document.getElementById('waterCount'),
  netzero: document.getElementById('netzeroCount'),
  renew: document.getElementById('renewCount'),
  pBar: document.getElementById('progressBar'),
  pPct: document.getElementById('progressPct'),
  list: document.getElementById('attendeeList'),
  card: {
    water: document.getElementById('card-water'),
    netzero: document.getElementById('card-netzero'),
    renew: document.getElementById('card-renew'),
  },
  celebrate: new bootstrap.Toast(document.getElementById('celebrateToast')),
  celebrateMsg: document.getElementById('celebrateMsg'),
  clearData: document.getElementById('clearData'),
  downloadCsv: document.getElementById('downloadCsv')
};

// ---------- Helpers ----------
function totalCount(){
  return state.counts.water + state.counts.netzero + state.counts.renew;
}
function save(){
  localStorage.setItem('summit-state', JSON.stringify(state));
}
function render(){
  // counts
  els.water.textContent  = state.counts.water;
  els.netzero.textContent= state.counts.netzero;
  els.renew.textContent  = state.counts.renew;
  els.total.textContent  = totalCount();

  // winner highlight
  const max = Math.max(...Object.values(state.counts));
  for (const k of ['water','netzero','renew']){
    els.card[k].classList.toggle('winner', state.counts[k] && state.counts[k]===max);
  }

  // progress
  const pct = Math.min(100, Math.round(totalCount()/GOAL*100));
  els.pPct.textContent = pct;
  els.pBar.style.width = pct + '%';
  els.pBar.ariaValueNow = pct;

  // attendee list
  els.list.innerHTML = '';
  state.attendees.slice().reverse().forEach(a=>{
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <span>${escapeHTML(a.name)}</span>
      <span class="team-pill badge text-bg-secondary">${teamLabel(a.team)}</span>
    `;
    els.list.appendChild(li);
  });
}
function teamLabel(t){
  return t==='water' ? 'Water Wise'
       : t==='netzero' ? 'Net Zero'
       : 'Renewables';
}
function escapeHTML(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- Form submit (Check-In) ----------
els.form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = els.name.value.trim();
  const team = els.team.value;
  if (!name || !team) return;

  // update state
  state.attendees.push({name, team});
  state.counts[team] = (state.counts[team]||0) + 1;
  save();

  // greeting (personalized)
  els.greeting.textContent = `Welcome, ${name}! You’ve checked in for ${teamLabel(team)}.`;

  // progress + celebration
  const before = totalCount() - 1;
  render();
  if (before < GOAL && totalCount() >= GOAL){
    // who is leading right now?
    const entries = Object.entries(state.counts);
    entries.sort((a,b)=>b[1]-a[1]);
    const leading = teamLabel(entries[0][0]);
    els.celebrateMsg.textContent = `Goal reached! 🎉 Current leader: ${leading}`;
    els.celebrate.show();
  }

  // reset inputs
  els.name.value = '';
  els.team.value = '';
  els.name.focus();
});

// ---------- Clear + CSV ----------
els.clearData.addEventListener('click', ()=>{
  if (!confirm('Clear saved counts and attendees?')) return;
  state.attendees = [];
  state.counts = { water:0, netzero:0, renew:0 };
  save(); render();
});
els.downloadCsv.addEventListener('click', ()=>{
  const rows = [['name','team']];
  state.attendees.forEach(a=>rows.push([a.name, teamLabel(a.team)]));
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:'attendees.csv'});
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// ---------- First paint ----------
render();
