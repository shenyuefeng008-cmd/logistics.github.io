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
