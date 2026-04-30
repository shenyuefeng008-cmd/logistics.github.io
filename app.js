// ── QClaw AI 客服（网关 chatCompletions） ──
const QCLAW_GATEWAY = 'http://127.0.0.1:28789/v1/chat/completions';
const QCLAW_TOKEN = '';

const SYS_PROMPT = '你是JLLogi捷流物流的在线客服。JLLogi专注国际快递18年，与UPS、FedEx、东航、大韩航空、美森官方合作。服务：国际快递(UPS/FedEx 3-7天)、国际空运(5-10天)、美森海运(15-25天)、专线物流(10-20天)。覆盖220+国家。\n\n报价参考(元/kg)：\n- 国际快递: 美国38 英国42 德国40 日本22 韩国18 澳洲35 加拿大40\n- 国际空运: 美国25 英国28 德国27 日本15 韩国12 澳洲24 加拿大27\n- 美森海运: 美国18 英国20 德国19 日本10 韩国8 澧洲16 加拿大19\n- 专线物流: 美国30 英国32 德国30 日本18 韩国14 澧洲26 加拿大30\n\n规则：\n1. 回答简洁专业，报价后主动问是否需要提交询价\n2. 重量按客户给出的计算，没给就按10kg估算\n3. 价格用人民币(¥)\n4. 特殊货物(带电/液体/粉末)需加10-30%附加费';

function toggleChat(){
  var body = document.getElementById('ai-chat-body');
  var toggle = document.getElementById('chat-toggle');
  body.classList.toggle('hidden');
  toggle.textContent = body.classList.contains('hidden') ? '+' : '−';
}

function appendAI(role, text){
  var box = document.getElementById('ai-chat-messages');
  var div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.innerHTML = role === 'bot'
    ? '<div class="ai-avatar">💁‍♀️</div><div class="ai-bubble">' + text + '</div>'
    : '<div class="ai-bubble">' + text + '</div><div class="ai-avatar">👤</div>';
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function sendAI(){
  var input = document.getElementById('ai-input');
  var text = input.value.trim();
  if(!text) return;
  appendAI('user', text);
  input.value = '';
  appendAI('bot', '⏳ 正在回复...');

  var msgs = document.getElementById('ai-chat-messages');
  var loadingEl = msgs.lastChild;

  try {
    var headers = { 'Content-Type': 'application/json' };
    if(QCLAW_TOKEN) headers['Authorization'] = 'Bearer ' + QCLAW_TOKEN;

    var res = await fetch(QCLAW_GATEWAY, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'qclaw/pool-glm-5-turbo',
        messages: [
          { role: 'system', content: SYS_PROMPT },
          { role: 'user', content: text }
        ],
        stream: false
      })
    });

    if(!res.ok) throw new Error('API ' + res.status);
    var data = await res.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '抱歉，服务暂时不可用，请稍后再试或致电客服。';

    msgs.removeChild(loadingEl);
    appendAI('bot', reply.replace(/\n/g, '<br>'));
    window.__lastQuote = { message: text, reply: reply };
  } catch(e) {
    msgs.removeChild(loadingEl);
    // 本地兜底报价
    var parsed = parseLocal(text);
    var price = calcLocal(parsed);
    appendAI('bot', '⚠️ AI服务连接中，以下是参考报价：<br><strong>¥' + price + '</strong>（' + parsed.type + ' · ' + parsed.country + ' · ' + parsed.weight + 'kg）<br>如需精准报价，请留下联系方式，人工客服联系您。');
    window.__lastQuote = { parsed: parsed, price: price };
  }
}

function parseLocal(msg){
  var t = (msg || '').toLowerCase();
  var weight = 10, type = '国际快递', country = '美国';
  var wm = t.match(/(\d+(?:\.\d+)?)\s*(kg|公斤)?/);
  if(wm) weight = parseFloat(wm[1]);
  if(t.includes('空运')) type = '国际空运';
  if(t.includes('海运')) type = '美森海运';
  if(t.includes('专线')) type = '专线物流';
  if(t.includes('美国') || t.includes('usa')) country = '美国';
  if(t.includes('欧洲') || t.includes('eu')) country = '欧洲';
  if(t.includes('日本') || t.includes('jp')) country = '日本';
  if(t.includes('英国')) country = '英国';
  if(t.includes('德国')) country = '德国';
  return { weight: weight, type: type, country: country };
}

function calcLocal(p){
  var base = {'国际快递':38,'国际空运':25,'美森海运':18,'专线物流':30};
  var factor = {'美国':1,'日本':0.58,'韩国':0.47,'英国':1.1,'德国':1.05,'欧洲':1.3};
  return Math.round(p.weight * (base[p.type]||38) * (factor[p.country]||1));
}

// AI 客服提交线索
async function saveLead(){
  var name = document.getElementById('ai-name').value.trim();
  var contact = document.getElementById('ai-contact').value.trim();
  if(!contact){ appendAI('bot', '请至少留下一种联系方式~'); return; }

  var payload = { name: name||'匿名', contact: contact, quote: window.__lastQuote||null, time: new Date().toISOString() };
  var leads = JSON.parse(localStorage.getItem('logi_leads') || '[]');
  leads.push(payload);
  localStorage.setItem('logi_leads', JSON.stringify(leads));

  appendAI('bot', '✅ 询价已提交！专属客服会在30分钟内联系您。');
  document.getElementById('ai-name').value = '';
  document.getElementById('ai-contact').value = '';
}

// ── 运单查询 ──
function track(){
  var num = document.getElementById('num').value.trim();
  if(!num){ alert('请输入运单号'); return; }
  window.location.href = 'tracking.html?num=' + encodeURIComponent(num);
}

// ── 数据区动画 ──
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

function animateNum(el){
  var target = parseFloat(el.dataset.target);
  var suffix = el.dataset.suffix || '';
  var mult = parseFloat(el.dataset.mult) || 1;
  var isFloat = (target % 1 !== 0);
  var duration = 1800, start = null;
  function step(ts){
    if(!start) start = ts;
    var p = Math.min((ts - start) / duration, 1);
    var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    var val = target * mult * eased;
    el.textContent = isFloat ? val.toFixed(1)+suffix : Math.floor(val).toLocaleString()+suffix;
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── 报价表单 ──
function getQuote(){
  var origin = document.getElementById('q-origin').value;
  var dest = document.getElementById('q-dest').value;
  var cargoType = document.getElementById('q-type').value;
  var weight = parseFloat(document.getElementById('q-weight').value);
  var result = document.getElementById('quote-result');
  var plans = document.getElementById('quote-plans');

  if(!origin){ alert('请选择起运地'); return; }
  if(!dest){ alert('请选择目的地'); return; }
  if(!weight || weight <= 0){ alert('请输入有效重量'); return; }

  var rates = {
    '美国':{express:38,standard:26,economy:18},
    '英国':{express:42,standard:28,economy:20},
    '德国':{express:40,standard:27,economy:19},
    '法国':{express:41,standard:28,economy:20},
    '日本':{express:22,standard:15,economy:10},
    '韩国':{express:18,standard:12,economy:8},
    '澳大利亚':{express:35,standard:24,economy:16},
    '加拿大':{express:40,standard:27,economy:19}
  };

  var route = rates[dest] || {express:45,standard:30,economy:22};
  var w = weight;
  var surcharge = (cargoType === '带电产品') ? 1.15 : (cargoType === '敏感货') ? 1.25 : (cargoType === '大件货物') ? 1.2 : 1;

  plans.innerHTML =
    '<div class="quote-plan featured">' +
      '<div class="quote-plan-tag">推荐</div>' +
      '<div class="quote-plan-name">🚀 国际快递</div>' +
      '<div class="quote-plan-price">¥' + Math.round(route.express * w * surcharge) + '</div>' +
      '<div class="quote-plan-detail">UPS / FedEx</div>' +
      '<div class="quote-plan-time">⏱ 3-7个工作日</div>' +
    '</div>' +
    '<div class="quote-plan">' +
      '<div class="quote-plan-name">✈️ 国际空运</div>' +
      '<div class="quote-plan-price">¥' + Math.round(route.standard * w * surcharge) + '</div>' +
      '<div class="quote-plan-detail">东航 / 大韩航空</div>' +
      '<div class="quote-plan-time">⏱ 5-10个工作日</div>' +
    '</div>' +
    '<div class="quote-plan">' +
      '<div class="quote-plan-name">🚢 美森海运</div>' +
      '<div class="quote-plan-price">¥' + Math.round(route.economy * w * surcharge) + '</div>' +
      '<div class="quote-plan-detail">美森快船专线</div>' +
      '<div class="quote-plan-time">⏱ 15-25个工作日</div>' +
    '</div>';

  if(surcharge > 1){
    plans.innerHTML += '<div class="quote-note" style="text-align:center;margin-top:12px;color:#e67e22;font-size:13px">⚠️ ' + cargoType + '附加费 +' + Math.round((surcharge-1)*100) + '%</div>';
  }

  result.style.display = 'block';
  result.scrollIntoView({behavior:'smooth', block:'nearest'});
}

// ── 报价表单提交询价 ──
function submitQuoteInquiry(){
  var name = document.getElementById('qs-name').value.trim();
  var contact = document.getElementById('qs-contact').value.trim();
  if(!contact){ alert('请至少填写一种联系方式（手机/微信/邮箱）'); return; }

  var origin = document.getElementById('q-origin').value;
  var dest = document.getElementById('q-dest').value;
  var weight = document.getElementById('q-weight').value;
  var cargoType = document.getElementById('q-type').value || '普通货物';

  var inquiry = {
    name: name || '匿名',
    contact: contact,
    origin: origin,
    dest: dest,
    weight: weight,
    cargoType: cargoType,
    time: new Date().toISOString()
  };

  // 保存到 localStorage
  var leads = JSON.parse(localStorage.getItem('logi_leads') || '[]');
  leads.push(inquiry);
  localStorage.setItem('logi_leads', JSON.stringify(leads));

  alert('✅ 询价已提交！\n\n' + origin + ' → ' + dest + '\n' + weight + 'kg · ' + cargoType + '\n\n专属客服将在30分钟内联系 ' + contact);
  document.getElementById('qs-name').value = '';
  document.getElementById('qs-contact').value = '';
}
