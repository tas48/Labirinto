let labirinto = [];
const inicio = [4, 11]; // Posição inicial (5, 12) devido array começar em 0
const fim = [10, 0];   // Posição final (11, 1)
let emExecucao = false; // lock de controle, evitando dupla execução


async function carregarLabirinto() {
  try {
    const response = await fetch('labirinto.dat');
    const texto = await response.text();
    labirinto = texto.trim().split('\n').map(linha => linha.split(' ').map(Number));
    desenharLabirinto();
  } catch (erro) {
    console.error("Erro ao carregar o labirinto:", erro);
  }
}

function desenharLabirinto() {
  const container = document.getElementById('labirinto');
  container.style.gridTemplateColumns = `repeat(${labirinto[0].length}, 40px)`;
  container.innerHTML = '';

  labirinto.forEach((linha, i) => {
    linha.forEach((celula, j) => {
      const div = document.createElement('div');
      div.classList.add('celula');
      if (celula === 0) div.classList.add('parede');
      else if (celula === 1) div.classList.add('caminho');
      if (i === inicio[0] && j === inicio[1]) div.classList.add('inicio');
      if (i === fim[0] && j === fim[1]) div.classList.add('fim');
      div.setAttribute('data-pos', `${i}-${j}`);
      container.appendChild(div);
    });
  });
}

// Atualizar o estado visual de uma célula
function atualizarCelula(x, y, classe, texto = null) {
  const celula = document.querySelector(`[data-pos='${x}-${y}']`);
  if (celula) {
    celula.classList.add(classe);
    if (texto !== null) {
      celula.innerText = texto;
      celula.style.color = "white";
      celula.style.fontSize = "14px";
    }
  }
}

// Função para encontrar movimentos válidos
function encontrarMovimentos(x, y, visitados) {
  const movimentos = [
    [-1, 0], // cima
    [0, -1], // esquerda
    [0, 1],  // direita
    [1, 0]   // baixo
  ];

  return movimentos
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([nx, ny]) => labirinto[nx]?.[ny] === 1 && !visitados.has(`${nx}-${ny}`));
}

// delay para melhor visualizar as células sendo visitadas
function pausar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function exibirResultado(passos, sucesso) {
  const resultado = document.getElementById('resultado');
  if (sucesso) {
    resultado.innerText = `Destino alcançado em ${passos} passos!`;
  } else {
    resultado.innerText = "Destino não encontrado!";
  }
  emExecucao = false;
}

async function buscaLargura() {
  if (emExecucao) return;
  emExecucao = true;

  const fila = [inicio];
  const visitados = new Set();
  visitados.add(`${inicio[0]}-${inicio[1]}`);
  let passos = 0;

  while (fila.length > 0) {
    const [x, y] = fila.shift();
    atualizarCelula(x, y, 'visitado');

    if (x === fim[0] && y === fim[1]) {
      exibirResultado(passos, true);
      return;
    }

    for (const [nx, ny] of encontrarMovimentos(x, y, visitados)) {
      fila.push([nx, ny]);
      visitados.add(`${nx}-${ny}`);
      atualizarCelula(nx, ny, 'fronteira');
      await pausar(100);
    }
    passos++;
  }

  exibirResultado(passos, false);
}

async function buscaProfundidade() {
  if (emExecucao) return;
  emExecucao = true;

  const pilha = [inicio];
  const visitados = new Set();
  let passos = 0;

  while (pilha.length > 0) {
    const [x, y] = pilha.pop();

    if (visitados.has(`${x}-${y}`)) continue;
    visitados.add(`${x}-${y}`);
    atualizarCelula(x, y, 'visitado');

    if (x === fim[0] && y === fim[1]) {
      exibirResultado(passos, true);
      return;
    }

    for (const [nx, ny] of encontrarMovimentos(x, y, visitados)) {
      pilha.push([nx, ny]);
      atualizarCelula(nx, ny, 'fronteira');
      await pausar(100);
    }
    passos++;
  }

  exibirResultado(passos, false);
}

function distanciaEuclidiana(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

async function buscaAEstrela() {
  if (emExecucao) return;
  emExecucao = true;

  const fila = [{ posicao: inicio, g: 0, f: distanciaEuclidiana(...inicio, ...fim) }];
  const visitados = new Set();
  const custos = new Map(); // Custo acumulado g(n)
  custos.set(`${inicio[0]}-${inicio[1]}`, 0);

  let passos = 0;

  while (fila.length > 0) {
    // escolher o nó com menor f(n)
    fila.sort((a, b) => a.f - b.f);
    const { posicao: [x, y], g } = fila.shift();

    if (visitados.has(`${x}-${y}`)) continue;
    visitados.add(`${x}-${y}`);
    atualizarCelula(x, y, 'visitado', g);


    if (x === fim[0] && y === fim[1]) { // if destino ok, para
      exibirResultado(passos, true);
      return;
    }

    for (const [nx, ny] of encontrarMovimentos(x, y, visitados)) {
      const novoG = g + 1; // Custo acumulado (1 para cada movimento)
      const h = distanciaEuclidiana(nx, ny, fim[0], fim[1]); // Heurística euclidiana ao destino
      const f = novoG + h; // f(n) = g(n) + h(n)

      if (!custos.has(`${nx}-${ny}`) || novoG < custos.get(`${nx}-${ny}`)) {
        custos.set(`${nx}-${ny}`, novoG);
        fila.push({ posicao: [nx, ny], g: novoG, f });
        atualizarCelula(nx, ny, 'fronteira', h.toFixed(1));
      }
    }
    passos++;
    await pausar(50); 
  }

  exibirResultado(passos, false); // Não encontrou o destino
}

function iniciarBusca(algoritmo) {
  if (algoritmo === 'largura') buscaLargura();
  else if (algoritmo === 'profundidade') buscaProfundidade();
  else if (algoritmo === 'aestrela')  buscaAEstrela();
}


carregarLabirinto();
