function trackShipment() {
  var input = document.getElementById("trackingInput");
  var num = input.value.trim();

  if (!num) {
    alert("请输入运单号");
    return;
  }

  window.location.href = "tracking.html?num=" + encodeURIComponent(num);
}

function submitQuote(event) {
  event.preventDefault();
  alert("您的咨询已提交，我们的团队将在 24 小时内与您联系。");
}
