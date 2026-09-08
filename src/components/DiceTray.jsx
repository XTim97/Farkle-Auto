import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const DIE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const DIE_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899"
];

function rollDice(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${Date.now()}-${index}-${Math.random()}`,
    value: Math.floor(Math.random() * 6) + 1,
    color: DIE_COLORS[index % DIE_COLORS.length]
  }));
}

const DiceTray = forwardRef(function DiceTray(
  { activePlayerId, disabled, onSelectionChange, onRollStateChange },
  ref
) {
  const [dice, setDice] = useState([]);
  const [selectedDiceIds, setSelectedDiceIds] = useState([]);
  const [hasRolled, setHasRolled] = useState(false);
  const [readyToRollAgain, setReadyToRollAgain] = useState(false);
  const [lastConsumed, setLastConsumed] = useState(null);

  useEffect(() => {
    setDice([]);
    setSelectedDiceIds([]);
    setHasRolled(false);
    setReadyToRollAgain(false);
    setLastConsumed(null);
  }, [activePlayerId]);

  useEffect(() => {
    onSelectionChange?.(selectedDiceIds.length);
  }, [selectedDiceIds, onSelectionChange]);

  useEffect(() => {
    onRollStateChange?.({
      hasRolled,
      readyToRollAgain,
      diceRemaining: dice.length
    });
  }, [dice.length, hasRolled, readyToRollAgain, onRollStateChange]);

  function rollCurrentDice() {
    const count = hasRolled ? (dice.length || 6) : 6;
    setDice(rollDice(count));
    setSelectedDiceIds([]);
    setHasRolled(true);
    setReadyToRollAgain(false);
    setLastConsumed(null);
  }

  function toggleDie(dieId) {
    setSelectedDiceIds((current) =>
      current.includes(dieId)
        ? current.filter((id) => id !== dieId)
        : [...current, dieId]
    );
  }

  useImperativeHandle(ref, () => ({
    rollCurrentDice() {
      if (disabled || (hasRolled && !readyToRollAgain)) return false;
      rollCurrentDice();
      return true;
    },
    consumeSelectedDice() {
      if (!hasRolled || selectedDiceIds.length === 0) {
        return false;
      }

      const selectedSet = new Set(selectedDiceIds);
      const consumed = dice.filter((die) => selectedSet.has(die.id));
      const remaining = dice.filter((die) => !selectedSet.has(die.id));

      setLastConsumed({ before: dice, consumed, wasReadyToRollAgain: readyToRollAgain });
      setDice(remaining);
      setSelectedDiceIds([]);
      setReadyToRollAgain(true);
      return true;
    },
    undoLastConsume() {
      if (!lastConsumed || !readyToRollAgain) return false;
      setDice(lastConsumed.before);
      setSelectedDiceIds(lastConsumed.consumed.map((die) => die.id));
      setReadyToRollAgain(lastConsumed.wasReadyToRollAgain);
      setLastConsumed(null);
      return true;
    },
    resetTurn() {
      setDice([]);
      setSelectedDiceIds([]);
      setHasRolled(false);
      setReadyToRollAgain(false);
      setLastConsumed(null);
    }
  }), [dice, disabled, hasRolled, lastConsumed, readyToRollAgain, selectedDiceIds]);

  // Keep the roller completely out of the layout until Auto Roll is used.
  if (!hasRolled) {
    return null;
  }

  return (
    <section className="dice-area" aria-label="Dice roller">
      <div className="dice-area-toolbar">
        {!readyToRollAgain && dice.length > 0 && (
          <span className="dice-selection-status" aria-live="polite">
            {selectedDiceIds.length === 0
              ? (
                <>
                  <span>Tap each die you want to select</span>
                  <span className="dice-instruction-secondary">Score each <strong>INDIVIDUAL</strong> die separately</span>
                </>
              )
              : `${selectedDiceIds.length} selected — tap a scoring button`}
          </span>
        )}

        {readyToRollAgain && (
          <span className="dice-selection-status" aria-live="polite">
            {dice.length === 0
              ? "All 6 dice scored — Auto Roll all 6 again or end your turn"
              : selectedDiceIds.length > 0
                ? `${selectedDiceIds.length} selected — tap another scoring button, Auto Roll, or end your turn`
                : `${dice.length} dice left — select more to score, Auto Roll, or end your turn`}
          </span>
        )}
      </div>

      <div className={`dice-tray ${dice.length === 0 ? "empty" : ""}`}>
        {dice.length === 0 ? (
          <span className="dice-tray-placeholder">All dice have been scored</span>
        ) : (
          dice.map((die) => {
            const selected = selectedDiceIds.includes(die.id);

            return (
              <button
                key={die.id}
                type="button"
                className={`die-button ${selected ? "selected" : ""}`}
                style={{ "--die-color": die.color }}
                onClick={() => toggleDie(die.id)}
                disabled={disabled}
                aria-pressed={selected}
                aria-label={`${selected ? "Selected" : "Unselected"} die showing ${die.value}`}
              >
                <span aria-hidden="true">{DIE_FACES[die.value - 1]}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
});

export default DiceTray;
