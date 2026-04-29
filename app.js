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

  // 滚动触发观察器
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        // 触发数字动画
        var nums = entry.target.querySelectorAll('.stat-num');
        nums.forEach(function(el){
          animateNum(el);
        });
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.3});

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
    // easeOutExpo
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
