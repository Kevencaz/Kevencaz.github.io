---
title: 🎮 小游戏
date: 2024-01-01 00:00:00
type: games
comments: false
---

<div class="game-container">
  <div class="game-tabs">
    <button class="game-tab-btn active" onclick="switchGame('snake')">🐍 贪吃蛇</button>
    <button class="game-tab-btn" onclick="switchGame('memory')">🃏 记忆翻牌</button>
    <button class="game-tab-btn" onclick="switchGame('typing')">⌨️ 打字挑战</button>
  </div>

  <!-- 贪吃蛇 -->
  <div id="game-snake" class="game-panel active">
    <div class="game-score">得分: <span id="snake-score">0</span></div>
    <div class="game-canvas-wrap">
      <canvas id="snake-canvas" width="400" height="400" style="background:#1a1a2e;display:block;"></canvas>
    </div>
    <p class="game-hint">方向键 / WASD 控制方向</p>
    <button class="game-btn" onclick="startSnake()">开始游戏</button>
  </div>

  <!-- 记忆翻牌 -->
  <div id="game-memory" class="game-panel">
    <div class="game-score">步数: <span id="memory-moves">0</span> | 配对: <span id="memory-pairs">0</span>/8</div>
    <div id="memory-board" style="display:grid;grid-template-columns:repeat(4,80px);gap:10px;justify-content:center;"></div>
    <button class="game-btn" onclick="startMemory()">重新开始</button>
  </div>

  <!-- 打字挑战 -->
  <div id="game-typing" class="game-panel">
    <div class="game-score">WPM: <span id="typing-wpm">0</span> | 正确率: <span id="typing-acc">100</span>%</div>
    <div id="typing-display" style="font-size:20px;font-family:monospace;background:#1a1a2e;color:#eee;padding:24px;border-radius:12px;min-height:60px;margin:16px auto;max-width:600px;line-height:1.8;text-align:left;"></div>
    <input id="typing-input" type="text" placeholder="在这里开始打字..." style="width:80%;max-width:560px;padding:12px 16px;font-size:16px;border:2px solid #667eea;border-radius:8px;outline:none;margin:8px 0;" autocomplete="off" />
    <br/>
    <button class="game-btn" onclick="startTyping()">新一轮</button>
  </div>
</div>

<script>
// ========== 游戏切换 ==========
function switchGame(name) {
  document.querySelectorAll('.game-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.game-tab-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('game-' + name).classList.add('active');
  event.target.classList.add('active');
}

// ========== 贪吃蛇 ==========
var snakeTimer, snakeDir, snakeBody, snakeFood, snakeScore, snakeRunning;
function startSnake() {
  var c = document.getElementById('snake-canvas');
  var ctx = c.getContext('2d');
  var gs = 20, cols = c.width / gs, rows = c.height / gs;
  snakeBody = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  snakeDir = {x:1,y:0}; snakeScore = 0; snakeRunning = true;
  document.getElementById('snake-score').textContent = '0';
  function placeFood(){ snakeFood = {x:Math.floor(Math.random()*cols), y:Math.floor(Math.random()*rows)}; }
  placeFood();
  if(snakeTimer) clearInterval(snakeTimer);
  snakeTimer = setInterval(function(){
    if(!snakeRunning) return;
    var head = {x: snakeBody[0].x + snakeDir.x, y: snakeBody[0].y + snakeDir.y};
    if(head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows){ clearInterval(snakeTimer); snakeRunning=false; return; }
    for(var i=0;i<snakeBody.length;i++){ if(snakeBody[i].x===head.x && snakeBody[i].y===head.y){ clearInterval(snakeTimer); snakeRunning=false; return; } }
    snakeBody.unshift(head);
    if(head.x===snakeFood.x && head.y===snakeFood.y){ snakeScore+=10; document.getElementById('snake-score').textContent=snakeScore; placeFood(); }
    else { snakeBody.pop(); }
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,c.width,c.height);
    // grid
    ctx.strokeStyle='rgba(255,255,255,0.03)';
    for(var gx=0;gx<cols;gx++){for(var gy=0;gy<rows;gy++){ctx.strokeRect(gx*gs,gy*gs,gs,gs);}}
    // food
    ctx.fillStyle='#f5576c'; ctx.beginPath(); ctx.arc(snakeFood.x*gs+gs/2, snakeFood.y*gs+gs/2, gs/2-2, 0, Math.PI*2); ctx.fill();
    // snake
    for(var j=0;j<snakeBody.length;j++){
      var ratio = j/snakeBody.length;
      ctx.fillStyle = 'hsl(' + (260 - ratio*60) + ',70%,' + (65 - ratio*15) + '%)';
      ctx.fillRect(snakeBody[j].x*gs+1, snakeBody[j].y*gs+1, gs-2, gs-2);
    }
  }, 120);
}
document.addEventListener('keydown', function(e){
  var map = {ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
             w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0},
             W:{x:0,y:-1},S:{x:0,y:1},A:{x:-1,y:0},D:{x:1,y:0}};
  if(map[e.key] && snakeRunning){
    var nd = map[e.key];
    if(nd.x !== -snakeDir.x || nd.y !== -snakeDir.y) snakeDir = nd;
  }
});

// ========== 记忆翻牌 ==========
var memoryCards, memoryFlipped, memoryMatched, memoryMoves, memoryLock;
function startMemory(){
  var emojis = ['🚀','💻','🎯','⚡','🔥','🎨','🧩','🌈'];
  var deck = emojis.concat(emojis);
  for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=deck[i];deck[i]=deck[j];deck[j]=t;}
  memoryCards=deck; memoryFlipped=[]; memoryMatched=[]; memoryMoves=0; memoryLock=false;
  document.getElementById('memory-moves').textContent='0';
  document.getElementById('memory-pairs').textContent='0';
  var board=document.getElementById('memory-board'); board.innerHTML='';
  deck.forEach(function(emoji,idx){
    var card=document.createElement('div');
    card.style.cssText='width:80px;height:80px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:32px;cursor:pointer;transition:all 0.3s ease;user-select:none;';
    card.textContent='?';
    card.dataset.idx=idx;
    card.addEventListener('click',function(){ flipCard(this); });
    board.appendChild(card);
  });
}
function flipCard(el){
  if(memoryLock) return;
  var idx=parseInt(el.dataset.idx);
  if(memoryMatched.indexOf(idx)!==-1 || memoryFlipped.indexOf(idx)!==-1) return;
  el.textContent=memoryCards[idx];
  el.style.background='#fff';
  el.style.transform='rotateY(180deg)';
  memoryFlipped.push(idx);
  if(memoryFlipped.length===2){
    memoryMoves++; document.getElementById('memory-moves').textContent=memoryMoves;
    memoryLock=true;
    var a=memoryFlipped[0],b=memoryFlipped[1];
    if(memoryCards[a]===memoryCards[b]){
      memoryMatched.push(a,b); memoryFlipped=[];
      document.getElementById('memory-pairs').textContent=memoryMatched.length/2;
      memoryLock=false;
    } else {
      setTimeout(function(){
        var cards=document.getElementById('memory-board').children;
        cards[a].textContent='?'; cards[a].style.background='linear-gradient(135deg,#667eea,#764ba2)'; cards[a].style.transform='';
        cards[b].textContent='?'; cards[b].style.background='linear-gradient(135deg,#667eea,#764ba2)'; cards[b].style.transform='';
        memoryFlipped=[]; memoryLock=false;
      },800);
    }
  }
}

// ========== 打字挑战 ==========
var typingSentences = [
  'const app = express();',
  'git commit -m "fix: resolve race condition"',
  'SELECT id, name FROM users WHERE active = 1;',
  'docker build -t myapp:latest .',
  'npm install --save-dev typescript',
  'function debounce(fn, delay) { return fn; }',
  'kubectl get pods --namespace production',
  'redis-cli SET session:token abc123 EX 3600',
  'CREATE INDEX idx_user_email ON users(email);',
  'export default defineConfig({ plugins: [vue()] });'
];
var typingStart, typingTarget, typingDone;
function startTyping(){
  typingTarget = typingSentences[Math.floor(Math.random()*typingSentences.length)];
  typingDone = false; typingStart = null;
  document.getElementById('typing-wpm').textContent='0';
  document.getElementById('typing-acc').textContent='100';
  renderTyping('');
  var inp = document.getElementById('typing-input');
  inp.value=''; inp.focus();
}
function renderTyping(input){
  var html='';
  for(var i=0;i<typingTarget.length;i++){
    if(i<input.length){
      html += input[i]===typingTarget[i]
        ? '<span style="color:#37c6c0">'+escHtml(typingTarget[i])+'</span>'
        : '<span style="color:#f5576c;text-decoration:underline">'+escHtml(typingTarget[i])+'</span>';
    } else if(i===input.length){
      html += '<span style="border-left:2px solid #667eea;animation:blink 1s infinite">'+escHtml(typingTarget[i])+'</span>';
    } else {
      html += '<span style="color:#666">'+escHtml(typingTarget[i])+'</span>';
    }
  }
  document.getElementById('typing-display').innerHTML=html;
}
function escHtml(c){ return c==='<'?'&lt;':c==='>'?'&gt;':c==='&'?'&amp;':c===' '?'&nbsp;':c; }
document.addEventListener('DOMContentLoaded',function(){
  var inp=document.getElementById('typing-input');
  if(!inp) return;
  inp.addEventListener('input',function(){
    if(!typingTarget||typingDone) return;
    if(!typingStart) typingStart=Date.now();
    var val=this.value;
    renderTyping(val);
    var correct=0;
    for(var i=0;i<val.length;i++){ if(val[i]===typingTarget[i]) correct++; }
    var acc=val.length?Math.round(correct/val.length*100):100;
    document.getElementById('typing-acc').textContent=acc;
    var elapsed=(Date.now()-typingStart)/60000;
    var words=val.trim().split(/\s+/).length;
    if(elapsed>0) document.getElementById('typing-wpm').textContent=Math.round(words/elapsed);
    if(val.length>=typingTarget.length){ typingDone=true; }
  });
});

// 初始化
document.addEventListener('DOMContentLoaded',function(){
  if(document.getElementById('snake-canvas')){
    var c=document.getElementById('snake-canvas'),ctx=c.getContext('2d');
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,400,400);
    ctx.fillStyle='#667eea'; ctx.font='20px sans-serif'; ctx.textAlign='center';
    ctx.fillText('点击「开始游戏」🎮',200,200);
  }
  if(document.getElementById('memory-board')) startMemory();
  if(document.getElementById('typing-display')) startTyping();
});
</script>
