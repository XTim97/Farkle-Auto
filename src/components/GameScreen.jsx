import { useCallback, useRef, useState } from "react";
import FinalRoundNotice from "./FinalRoundNotice";
import MiniScoreboard from "./MiniScoreboard";
import ScoreButtons from "./ScoreButtons";
import WinnerBanner from "./WinnerBanner";
import DiceTray from "./DiceTray";

export default function GameScreen({
  activePlayer,
  activePlayerIndex,
  players,
  currentTurnScore,
  currentTurnActions,
  finalRound,
  finalRoundStarter,
  gameOver,
  leader,
  getPlayerName,
  onAddScoringAction,
  onEndTurn,
  onFarkle,
  onUndo,
  onNewGame,
  onSamePlayers,
  onHome
}) {
  const diceTrayRef = useRef(null);
  const [selectedDiceCount, setSelectedDiceCount] = useState(0);
  const [diceState, setDiceState] = useState({
    hasRolled: false,
    readyToRollAgain: false,
    diceRemaining: 0
  });

  const handleSelectionChange = useCallback((count) => {
    setSelectedDiceCount(count);
  }, []);

  const handleRollStateChange = useCallback((nextState) => {
    setDiceState(nextState);
  }, []);

  function handleScoringAction(action) {
    // The built-in dice roller is optional. If the player has not used it,
    // scoring buttons work exactly as they did for physical dice.
    if (!diceState.hasRolled) {
      onAddScoringAction(action);
      return;
    }

    // Once the built-in roller is being used, selected on-screen dice must
    // match each scoring action so those dice can be removed from the tray.
    if (!diceTrayRef.current?.consumeSelectedDice()) return;
    onAddScoringAction(action);
  }

  function handleUndo() {
    diceTrayRef.current?.undoLastConsume();
    onUndo();
  }

  if (gameOver && leader) {
    return (
      <section className="game-over-screen">
        <WinnerBanner
          leader={leader}
          players={players}
          getPlayerName={getPlayerName}
          onSamePlayers={onSamePlayers}
          onNewPlayers={onNewGame}
          onHome={onHome}
        />
      </section>
    );
  }

  const scoreButtonsDisabled =
    gameOver ||
    (diceState.hasRolled && selectedDiceCount === 0);

  return (
    <>
      {finalRound.active && (
        <FinalRoundNotice
          finalRoundStarter={finalRoundStarter}
          getPlayerName={getPlayerName}
        />
      )}

      <section className="turn-screen">
        <article className="player-card active-player">
          <MiniScoreboard
            players={players}
            activePlayerIndex={activePlayerIndex}
            getPlayerName={getPlayerName}
          />

          <div className="active-turn-header">
            <h2>{getPlayerName(activePlayer, activePlayerIndex)}</h2>
            <span className="active-turn-score">
              <span className="turn-label">Turn:</span>
              <strong>{currentTurnScore.toLocaleString()}</strong>
            </span>
          </div>

          <DiceTray
            ref={diceTrayRef}
            activePlayerId={activePlayer?.id ?? activePlayerIndex}
            disabled={gameOver}
            onSelectionChange={handleSelectionChange}
            onRollStateChange={handleRollStateChange}
          />

          <ScoreButtons
            disabled={scoreButtonsDisabled}
            onAddScoringAction={handleScoringAction}
            onAutoRoll={() => diceTrayRef.current?.rollCurrentDice()}
            autoRollDisabled={gameOver || (diceState.hasRolled && !diceState.readyToRollAgain)}
          />

          <div className="card-actions">
            <button type="button" onClick={onEndTurn} disabled={gameOver}>
              End Turn
            </button>

            <button
              type="button"
              className="danger"
              onClick={onFarkle}
              disabled={gameOver}
            >
              Farkle
            </button>

            <button
              type="button"
              className="secondary undo-button"
              onClick={handleUndo}
              disabled={gameOver || currentTurnActions.length === 0}
            >
              Undo
            </button>
          </div>

        </article>
      </section>
    </>
  );
}
