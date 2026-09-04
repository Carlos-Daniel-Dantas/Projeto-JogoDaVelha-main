import { useState, useEffect } from "react";
import styles from "./Game.module.css";
import Board from '../Board/Board.jsx';
import Swal from "sweetalert2";

// 1. Função para reproduzir o som
const tocarSom = (caminhoDoSom) => {
  const audio = new Audio(caminhoDoSom);
  audio.play().catch((err) => console.log("Erro ao reproduzir áudio:", err));
};

export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const [tema, setTema] = useState("claro");

  // --- TIMERS ---
  const [tempoGeral, setTempoGeral] = useState(180); // 3 minutos de partida
  const [tempoTurno, setTempoTurno] = useState(10);  // 10 segundos por jogada

  const alternarTema = () => {
    setTema((temaAtual) => (temaAtual === 'claro' ? 'escuro' : 'claro'));
  };

  useEffect(() => {
    document.body.className = tema;
  }, [tema]);

  const [placar, setPlacar] = useState({ vitoriasX: 0, vitoriasO: 0, empates: 0 });
  const resultadoVitoria = calcularVencedor(currentSquares);
  const vencedor = resultadoVitoria ? resultadoVitoria.vencedor : null;

  // --- 1. TIMER GERAL DA PARTIDA (3 MINUTOS) ---
  useEffect(() => {
    if (tempoGeral <= 0) {
      let titulo = '⏰ Tempo Esgotado!';
      let mensagem = '';
      let icone = 'info';

      if (placar.vitoriasX > placar.vitoriasO) {
        titulo = '🏆 Vencedor do Torneio: Jogador X!';
        mensagem = `O Jogador X venceu o torneio com ${placar.vitoriasX} vitória(s)!`;
        icone = 'success';
      } else if (placar.vitoriasO > placar.vitoriasX) {
        titulo = '🏆 Vencedor do Torneio: Jogador O!';
        mensagem = `O Jogador O venceu o torneio com ${placar.vitoriasO} vitória(s)!`;
        icone = 'success';
      } else {
        mensagem = `O tempo acabou e houve um empate geral! (${placar.vitoriasX} x ${placar.vitoriasO})`;
      }

      Swal.fire({
        title: titulo,
        text: mensagem,
        icon: icone,
        confirmButtonText: 'Reiniciar Torneio',
        confirmButtonColor: '#3085d6',
      }).then((result) => {
        if (result.isConfirmed) {
          setTempoGeral(180);
          setTempoTurno(10);
          setPlacar({ vitoriasX: 0, vitoriasO: 0, empates: 0 });
          jumpTo(0);
        }
      });

      return;
    }

    const timerGeralInterval = setInterval(() => {
      setTempoGeral((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerGeralInterval);
  }, [tempoGeral, placar]);

  // --- 2. TIMER POR TURNO (10 SEGUNDOS POR JOGADA) ---
  useEffect(() => {
    // Se a rodada acabou ou a partida terminou, não conta o tempo da jogada
    if (vencedor || tempoGeral <= 0) return;

    if (tempoTurno <= 0) {
      const jogadorPerdeu = xIsNext ? "X" : "O";
      const proximoJogador = xIsNext ? "O" : "X";

      Swal.fire({
        title: '⌛ Tempo do turno esgotado!',
        text: `O Jogador ${jogadorPerdeu} demorou muito! A vez passou para o Jogador ${proximoJogador}.`,
        icon: 'warning',
        timer: 2000,
        showConfirmButton: false
      });

      // Passa a vez sem alterar o tabuleiro (adiciona uma jogada neutra/passagem de turno)
      setHistory((prevHistory) => [...prevHistory, currentSquares]);
      setCurrentMove((prevMove) => prevMove + 1);
      setTempoTurno(10); // Reseta o tempo da jogada
      return;
    }

    const timerTurnoInterval = setInterval(() => {
      setTempoTurno((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerTurnoInterval);
  }, [tempoTurno, currentMove, vencedor, tempoGeral, xIsNext, currentSquares]);

  // --- ALERTAS DE FIM DE PARTIDA INDIVIDUAL ---
  useEffect(() => {
    const deuEmpate = !vencedor && !currentSquares.includes(null);

    if (vencedor) {
      const timer = setTimeout(() => {
        Swal.fire({
          title: '🎉 Temos um vencedor!',
          text: `O Jogador ${vencedor === 'X' ? '1 (X)' : '2 (O)'} venceu a rodada!`,
          icon: 'success',
          confirmButtonText: 'Próxima Rodada',
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            jumpTo(0);
          }
        });
      }, 500);

      return () => clearTimeout(timer);
    } else if (deuEmpate) {
      Swal.fire({
        title: '🤝 Empate!',
        text: 'Ninguém venceu esta rodada.',
        icon: 'info',
        confirmButtonText: 'Próxima Rodada',
        confirmButtonColor: '#3085d6',
      }).then((result) => {
        if (result.isConfirmed) {
          jumpTo(0);
        }
      });
    }
  }, [currentSquares, vencedor]);

  function handlePlay(nextSquares) {
    if (xIsNext) {
      tocarSom("/som-x.mp3");
    } else {
      tocarSom("/som-o.mp3");
    }

    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);

    setCurrentMove(nextHistory.length - 1);
    setTempoTurno(10); // Reseta o timer de 10s quando o jogador faz uma jogada

    const resultado = calcularVencedor(nextSquares);
    const novoVencedor = resultado ? resultado.vencedor : null;

    if (novoVencedor === 'X') {
      setPlacar((placarAtual) => ({
        ...placarAtual,
        vitoriasX: placarAtual.vitoriasX + 1,
      }));
    } else if (novoVencedor === 'O') {
      setPlacar((placarAtual) => ({
        ...placarAtual,
        vitoriasO: placarAtual.vitoriasO + 1,
      }));
    } else if (!nextSquares.includes(null)) {
      setPlacar((placarAtual) => ({
        ...placarAtual,
        empates: placarAtual.empates + 1,
      }));
    }
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setTempoTurno(10); // Reseta o tempo da jogada ao resetar/voltar
  }

  function calcularVencedor(quadrados) {
    const combinacoes = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let i = 0; i < combinacoes.length; i++) {
      const [a, b, c] = combinacoes[i];
      if (quadrados[a] && quadrados[a] === quadrados[b] && quadrados[a] === quadrados[c]) {
        return {
          vencedor: quadrados[a],
          linhaIndex: i,
          indices: combinacoes[i]
        };
      }
    }
    return null;
  }

  // Função para formatar os segundos em 00:00
  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  const moves = history.map((squares, move) => {
    let description = move > 0 ? 'JOGADA ' + move : 'RESETAR';
    return (
      <li key={move}>
        <button className={styles.reset} onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img src="favicon.ico" alt="Logo" className={styles.logo} />
        <h1 className={styles.titulo}>Jogo da Velha</h1>
      </header>

      <button className={styles.tema} onClick={alternarTema}>
        {tema === 'claro' ? '🌙' : '🌞'}
      </button>

      <div className={styles.placar}>
        <div className={styles.itemPlacar}>
          <span>X</span>
          <strong>{placar.vitoriasX}</strong>
        </div>
        <div className={styles.itemPlacar}>
          <span>Empates</span>
          <strong>{placar.empates}</strong>
        </div>
        <div className={styles.itemPlacar}>
          <span>O</span>
          <strong>{placar.vitoriasO}</strong>
        </div>
      </div>

      {/* --- PAINEIS DE TEMPO --- */}
      <div id="cronometro-container" style={{ textAlign: "center", marginBottom: "15px" }}>
        <div>Tempo do Torneio: <strong>{formatarTempo(tempoGeral)}</strong></div>
        <div style={{ color: tempoTurno <= 3 ? "red" : "inherit", fontWeight: "bold" }}>
          Sua vez ({xIsNext ? "X" : "O"}): {tempoTurno}s
        </div>
      </div>

      <div className="game-board">
        <Board
          xIsNext={xIsNext}
          squares={currentSquares}
          onPlay={handlePlay}
          winningLine={resultadoVitoria ? resultadoVitoria.linhaIndex : null}
          winningSquares={resultadoVitoria ? resultadoVitoria.indices : []}
        />
      </div>

      <div className={styles.historico}>
        <ol>{moves}</ol>
      </div>
    </div>
  );
}