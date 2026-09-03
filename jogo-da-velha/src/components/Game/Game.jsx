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

  // --- NOVO: Estado para o Timer (180 segundos = 3 minutos) ---
  const [tempoRestante, setTempoRestante] = useState(180);

  const alternarTema = () => {
    setTema((temaAtual) => (temaAtual === 'claro' ? 'escuro' : 'claro'));
  };

  useEffect(() => {
    document.body.className = tema;
  }, [tema]);

  const [placar, setPlacar] = useState({ vitoriasX: 0, vitoriasO: 0, empates: 0 });
  const resultadoVitoria = calcularVencedor(currentSquares);
  const vencedor = resultadoVitoria ? resultadoVitoria.vencedor : null;

  // --- NOVO: useEffect para o Timer da partida ---
  useEffect(() => {
    // Se o tempo chegou a 0, para a contagem e decide o vencedor geral
    if (tempoRestante <= 0) {
      let mensagem = "";

      if (placar.vitoriasX > placar.vitoriasO) {
        mensagem = `O Jogador X venceu o torneio com ${placar.vitoriasX} vitória(s)!`;
      } else if (placar.vitoriasO > placar.vitoriasX) {
        mensagem = `O Jogador O venceu o torneio com ${placar.vitoriasO} vitória(s)!`;
      } else {
        mensagem = `O tempo acabou e houve um empate no placar geral! (${placar.vitoriasX} x ${placar.vitoriasO})`;
      }

      Swal.fire({
        title: '⏰ Fim de jogo!',
        text: mensagem,
        icon: 'info',
        confirmButtonText: 'Reiniciar Torneio',
        confirmButtonColor: '#3085d6',
      }).then((result) => {
        if (result.isConfirmed) {
          // Reseta o tempo e o placar
          setTempoRestante(180);
          setPlacar({ vitoriasX: 0, vitoriasO: 0, empates: 0 });
          jumpTo(0);
        }
      });

      return;
    }

    // Intervalo de 1 segundo para diminuir o timer
    const timerInterval = setInterval(() => {
      setTempoRestante((tempoAtual) => tempoAtual - 1);
    }, 1000);

    // Limpa o intervalo quando o componente desmonta ou atualiza
    return () => clearInterval(timerInterval);
  }, [tempoRestante, placar.vitoriasX, placar.vitoriasO]);

  useEffect(() => {
    const deuEmpate = !vencedor && !currentSquares.includes(null);

    if (vencedor) {
      const timer = setTimeout(() => {
        Swal.fire({
          title: '🎉 Temos um vencedor!',
          text: `O Jogador ${vencedor === 'X' ? '1 (X)' : '2 (O)'} venceu a partida!`,
          icon: 'success',
          confirmButtonText: 'Jogar Novamente',
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
        text: 'Ninguém venceu esta partida.',
        icon: 'info',
        confirmButtonText: 'Tentar Novamente',
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

  // --- NOVO: Função para formatar os segundos em 00:00 ---
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

      {/* --- ATUALIZADO: Exibindo o estado formatado direto no JSX --- */}
      <div id="cronometro-container">
        Tempo restante: <span>{formatarTempo(tempoRestante)}</span>
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