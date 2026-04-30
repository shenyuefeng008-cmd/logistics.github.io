// ── AI 客服 ──
const API_BASE = 'http://localhost:3000'; // 部署后改成实际地址

function toggleChat(){
  const body = document.getElementById('ai-chat-body');
  const toggle = document.getElementById('chat-toggle');
  body.classList.toggle('hidden');
  toggle.textContent = body.classList.contains('hidden') ? '+' : '−';
}

function appendAI(role, text){
  const box = document.getElementById('ai-chat-messages');
  const div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.innerHTML = role === 'bot' 
    ? '<div class="ai-avatar">🤖</div><div class="ai-bubble">' + text + '</div>'
    : '<div class="ai-bubble">' + text + '</div><div class="ai-avatar">👤</div>';
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function sendAI(){
  const input = document.getElementById('ai-input');
  const text = input.value.trim();
  if(!text) return;
  appendAI('user', text);
  input.value = '';

  // 本地解析（无需后端也能用）
  const parsed = parseMessageLocal(text);
  const price = calculatePriceLocal(parsed);
  
  const reply = '预估报价：<strong>$' + price + '</strong><br>（' + parsed.type + '，' + parsed.country + '，' + parsed.weight + 'kg）<br>需要我帮您提交询价或联系销售吗？';
  
  appendAI('bot', reply);
  window.__lastQuote = { parsed, price };
}

function parseMessageLocal(msg){
  const text = (msg || '').toLowerCase();
  let weight = 10;
  let type = '国际快递';
  let country = '美国';
  
  const wMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|公斤)?/);
  if(wMatch) weight = parseFloat(wMatch[1]);
  
  if(text.includes('空运')) type = '国际空运';
  if(text.includes('海运')) type = '美森海运';
  if(text.includes('快递')) type = '国际快递';
  if(text.includes('专线')) type = '专线物流';
  
  if(text.includes('美国') || text.includes('usa')) country = '美国';
  if(text.includes('欧洲') || text.includes('eu')) country = '欧洲';
  if(text.includes('日本') || text.includes('jp')) country = '日本';
  if(text.includes('英国')) country = '英国';
  if(text.includes('德国')) country = '德国';
  
  return { weight, type, country };
}

function calculatePriceLocal({weight, country, type}){
  const baseMap = { '国际快递': 8, '国际空运': 5, '美森海运': 2, '专线物流': 3 };
  const factorMap = { '美国': 1.2, '欧洲': 1.5, '日本': 1.1, '英国': 1.3, '德国': 1.4 };
  const base = baseMap[type] || 8;
  const factor = factorMap[country] || 1.0;
  return Math.round(weight * base * factor);
}

async function saveLead(){
  const name = document.getElementById('ai-name').value.trim();
  const contact = document.getElementById('ai-contact').value.trim();
  
  if(!contact){ appendAI('bot', '请至少留下一种联系方式哦~'); return; }
  
  const payload = { name: name || '匿名', contact, quote: window.__lastQuote || null, time: new Date().toISOString() };
  
  // 尝试发送到后端（如果有）
  try{
    await fetch(API_BASE + '/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }catch(e){ /* 后端未部署时忽略 */ }
  
  // 同时保存到本地（演示用）
  const leads = JSON.parse(localStorage.getItem('logi_leads') || '[]');
  leads.push(payload);
  localStorage.setItem('logi_leads', JSON.stringify(leads));
  
  appendAI('bot', '✅ 已提交！专属客服会尽快联系您。');
  document.getElementById('ai-name').value = '';
  document.getElementById('ai-contact').value = '';
}

// 运单查询
function track(){
  var num = document.getElementById('num').value.trim();
  if(!num){
    alert('请输入运单号');
    return;
  }
  window.location.href = 'tracking.html?num=' + encodeURIComponent(num);
}

// ── 数据区域动画 ──
document.addEventListener('DOMContentLoaded', function(){
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        var nums = entry.target.querySelectorAll('.stat-num');
        nums.forEach(function(el){ animateNum(el); });
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.25});

  var statsRow = document.getElementById('stats-row');
  if(statsRow) observer.observe(statsRow);
});

// 数字滚动动画
function animateNum(el){
  var target = parseFloat(el.dataset.target);
  var suffix = el.dataset.suffix || '';
  var mult = parseFloat(el.dataset.mult) || 1;
  var isFloat = (target % 1 !== 0);
  var duration = 1800;
  var start = null;

  function step(timestamp){
    if(!start) start = timestamp;
    var progress = Math.min((timestamp - start) / duration, 1);
    var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    var val = target * mult * eased;
    if(isFloat){
      el.textContent = val.toFixed(1) + suffix;
    } else {
      el.textContent = Math.floor(val).toLocaleString() + suffix;
    }
    if(progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── 报价功能 ──
function getQuote(){
  var origin = document.getElementById('q-origin').value;
  var dest = document.getElementById('q-dest').value;
  var weight = parseFloat(document.getElementById('q-weight').value);
  var result = document.getElementById('quote-result');
  var plans = document.getElementById('quote-plans');

  if(!origin){ alert('请选择起运地'); return; }
  if(!dest){ alert('请选择目的地'); return; }
  if(!weight || weight <= 0){ alert('请输入有效重量'); return; }

  // 模拟报价数据（单位：元/kg）
  var rates = {
    '美国':   { express: 38, standard: 26, economy: 18 },
    '英国':   { express: 42, standard: 28, economy: 20 },
    '德国':   { express: 40, standard: 27, economy: 19 },
    '法国':   { express: 41, standard: 28, economy: 20 },
    '日本':   { express: 22, standard: 15, economy: 10 },
    '韩国':   { express: 18, standard: 12, economy: 8 },
    '澳大利亚':{ express: 35, standard: 24, economy: 16 },
    '加拿大':  { express: 40, standard: 27, economy: 19 },
  };

  var route = rates[dest] || { express: 45, standard: 30, economy: 22 };
  var w = weight;

  var plans_html = [
    '<div class="quote-plan featured">' +
      '<div class="quote-plan-name">🚀 快递</div>' +
      '<div class="quote-plan-price">¥' + Math.round(route.express * w) + '</div>' +
      '<div class="quote-plan-time">预计3-7个工作日到达</div>' +
    '</div>',
    '<div class="quote-plan">' +
      '<div class="quote-plan-name">🚢 专线</div>' +
      '<div class="quote-plan-price">¥' + Math.round(route.standard * w) + '</div>' +
      '<div class="quote-plan-time">预计10-15个工作日到达</div>' +
    '</div>',
    '<div class="quote-plan">' +
      '<div class="quote-plan-name">📦 海运</div>' +
      '<div class="quote-plan-price">¥' + Math.round(route.economy * w) + '</div>' +
      '<div class="quote-plan-time">预计25-35个工作日到达</div>' +
    '</div>',
  ].join('');

  plans.innerHTML = plans_html;
  result.style.display = 'block';
  result.scrollIntoView({behavior:'smooth', block:'nearest'});
}
