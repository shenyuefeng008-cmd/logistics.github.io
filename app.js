function track(){
  var num = document.getElementById('num').value.trim();
  if(!num){
    alert('请输入运单号');
    return;
  }
  window.location.href = 'tracking.html?num=' + encodeURIComponent(num);
}
