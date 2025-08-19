/* ---------------------------
  Juego de Memoria Matemática
   - Dificultad: easy/medium/hard
   - Tiempo según dificultad
   - Popup final: Jugador 1, puntos y tiempo gastado
----------------------------*/

const startBtn = document.getElementById('startBtn');
const tablero = document.getElementById('tablero');
const puntosEl = document.getElementById('puntos');
const tiempoEl = document.getElementById('tiempo');
const popup = document.getElementById('popup');
const puntosFinalesEl = document.getElementById('puntosFinales');
const tiempoGastadoEl = document.getElementById('tiempoGastado');
const repetirBtn = document.getElementById('repetir');
const difBtns = document.querySelectorAll('.dif-btn');

let dificultad = 'medium'; // default
let paresCount = 8; // default pairs
let initialTime = 60; // seg
let tiempoRestante;
let timer = null;
let cartas = [];
let primera = null;
let bloqueo = false;
let puntos = 0;
let matchsEncontrados = 0;
let gameOver = false;

// configurar dificultad al clicar botones
difBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    difBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    dificultad = btn.dataset.dif;
    if(dificultad === 'easy'){ paresCount = 4; initialTime = 40; }
    if(dificultad === 'medium'){ paresCount = 8; initialTime = 50; }
    if(dificultad === 'hard'){ paresCount = 12; initialTime = 60; }
  });
});
// dejar medio activo al inicio
document.querySelector('.dif-btn[data-dif="medium"]').classList.add('active');

// iniciar juego
startBtn.addEventListener('click', () => iniciarJuego());

// reiniciar desde popup
repetirBtn.addEventListener('click', () => location.reload());

// Genera pares de operaciones aleatorias sin repetir fácilmente
function generarPares(n){
  const ops = ['+','-','*','/'];
  const pares = [];
  const vistos = new Set();

  while(pares.length < n){
    const op = ops[Math.floor(Math.random()*ops.length)];
    let a = Math.floor(Math.random()*9)+1; // 1..9
    let b = Math.floor(Math.random()*9)+1;

    // para division, asegurar divisible
    if(op === '/'){
      a = a * b;
    }

    const pregunta = `${a} ${op} ${b}`;
    // calculamos resultado con precisión adecuada
    let resultado = eval(pregunta);
    // si es entero lo dejamos, si no redondeamos a 2 decimales
    resultado = Number.isInteger(resultado) ? String(resultado) : String(parseFloat(resultado.toFixed(2)));

    // evitar pares con el mismo 'pregunta|resultado'
    const clave = pregunta + '|' + resultado;
    if(vistos.has(clave)) continue;
    vistos.add(clave);

    pares.push({ pregunta, resultado });
  }
  return pares;
}

// mezclador
function mezclar(array){
  return array.sort(() => Math.random() - 0.5);
}

function iniciarJuego(){
  // reset
  clearInterval(timer);
  tablero.innerHTML = '';
  puntos = 0; matchsEncontrados = 0; primera = null; bloqueo = false; cartas = []; gameOver = false;
  puntosEl.textContent = puntos;

  // ajustar paresCount según dificultad (ya configurado)
  const pares = generarPares(paresCount);

  // crear array de cartas (pregunta y respuesta por cada par) con id de pareja
  let deck = [];
  pares.forEach((p, i) => {
    deck.push({ tipo:'preg', texto:p.pregunta, pair:i });
    deck.push({ tipo:'res', texto:p.resultado, pair:i });
  });

  deck = mezclar(deck);
  cartas = deck;

let columnas = 4;
if (dificultad === 'hard') {
    columnas = 6;
}
tablero.style.setProperty('--cols', columnas);
  // renderizar cartas (estructura para flip)
  deck.forEach((c, index) => {
    const el = document.createElement('div');
    el.classList.add('carta');
    el.dataset.index = index;
    el.dataset.pair = c.pair;
    el.dataset.tipo = c.tipo;

el.innerHTML = `
    <div class="carta-inner" aria-hidden="true">
        <div class="carta-face carta-back"></div>
        <div class="carta-face carta-front">${c.texto}</div>
    </div>
`;

    // al dar click
    el.addEventListener('click', () => manejarClick(el));
    tablero.appendChild(el);
  });

  // Mostrar todas las cartas brevemente al inicio
  const cartasDOM = document.querySelectorAll('.carta');
  cartasDOM.forEach(carta => carta.classList.add('volteada'));
  setTimeout(() => {
      cartasDOM.forEach(carta => carta.classList.remove('volteada'));
  }, 15000);

  // tiempo
  tiempoRestante = initialTime;
  tiempoEl.textContent = tiempoRestante;
  timer = setInterval(() => {
 tiempoRestante--;
     tiempoEl.textContent = tiempoRestante;
    if(tiempoRestante <= 0){
        clearInterval(timer);
        finalizarJuego();
     }
  }, 1000);
}
// manejar click en una carta
function manejarClick(el){
  if(gameOver) return;
  if(bloqueo) return;
  if(el.classList.contains('volteada')) return;

  voltear(el);

  if(!primera){
    primera = el;
    return;
  }

  // hay una primera, ahora comparamos
  bloqueo = true;
  const segunda = el;

  if(primera.dataset.pair === segunda.dataset.pair && primera.dataset.index !== segunda.dataset.index){
    // match correcto
    puntos++;
    matchsEncontrados++;
    puntosEl.textContent = puntos;

    // dejar volteadas y remover la posibilidad de volver a click
    setTimeout(() => {
      primera.classList.add('matched');
      segunda.classList.add('matched');
      primera.removeEventListener('click', () => {});
      segunda.removeEventListener('click', () => {});
      primera = null;
      bloqueo = false;

      // si encontró todos los pares antes del tiempo -> terminar
      if(matchsEncontrados === paresCount){
        clearInterval(timer);
        finalizarJuego(true); // finalizó por ganar
      }
    }, 300);

  } else {
    // no es pareja -> volver a tapar
    setTimeout(() => {
      quitarVoltear(primera);
      quitarVoltear(segunda);
      primera = null;
      bloqueo = false;
    }, 900);
  }
}

function voltear(el){
  el.classList.add('volteada');
  const inner = el.querySelector('.carta-inner');
  inner.style.transform = 'rotateY(180deg)';
  // mostrar texto (ya está en front)
}

function quitarVoltear(el){
  el.classList.remove('volteada');
  const inner = el.querySelector('.carta-inner');
  inner.style.transform = '';
}

// finalizar juego (por tiempo o porque ganó)
function finalizarJuego(gano=false){
  gameOver = true;

  // bloquear futuros clicks
  document.querySelectorAll('.carta').forEach(c => {
    c.style.cursor = 'default';
  });

  // preparar popup con info
  puntosFinalesEl.textContent = puntos;
  const tiempoGastado = initialTime - Math.max(0, tiempoRestante);
  tiempoGastadoEl.textContent = tiempoGastado;
  popup.classList.remove('oculto');
}


