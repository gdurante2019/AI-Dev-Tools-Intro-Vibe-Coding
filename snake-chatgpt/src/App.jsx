import React, { useState, useEffect, useCallback } from "react";

// Board configuration
const BOARD_SIZE = 24; // 24x24 grid (slightly larger)
const INITIAL_SNAKE = [
  { x: 10, y: 12 },
  { x: 9, y: 12 },
  { x: 8, y: 12 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 }; // moving right

// Inline styles so the preview works without a separate CSS file
const containerStyle = {
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  background: "#111827",
  color: "#e5e7eb",
  minHeight: "100vh",
  padding: "20px 0",
  textAlign: "center",
};

const boardBaseStyle = {
  display: "grid",
  width: "480px", // scaled with board size
  height: "480px",
  border: "2px solid #4b5563",
  background: "#030712",
  margin: "0 auto",
};

const cellBaseStyle = {
  boxSizing: "border-box",
  border: "1px solid #020617",
  background: "#030712",
};

const infoBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  maxWidth: "480px",
  margin: "0 auto 8px auto",
  fontSize: "14px",
};

const controlsStyle = {
  marginTop: "12px",
};

const buttonStyle = {
  margin: "0 4px",
  padding: "6px 12px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  background: "#374151",
  color: "#e5e7eb",
  fontSize: "14px",
};

const gameOverStyle = {
  marginTop: "10px",
  color: "#f97316",
  fontWeight: "bold",
};

const hintStyle = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#9ca3af",
};

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(() => getRandomFood(INITIAL_SNAKE));
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(250); // slower movement (ms per move)
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Handle keyboard input (block 180° turns)
  const handleKeyDown = useCallback(
    (e) => {
      if (
        !isRunning &&
        !gameOver &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        setIsRunning(true);
      }

      setDirection((currentDir) => {
        switch (e.key) {
          case "ArrowUp":
            if (currentDir.y === 1) return currentDir; // prevent 180° turn
            return { x: 0, y: -1 };
          case "ArrowDown":
            if (currentDir.y === -1) return currentDir;
            return { x: 0, y: 1 };
          case "ArrowLeft":
            if (currentDir.x === 1) return currentDir;
            return { x: -1, y: 0 };
          case "ArrowRight":
            if (currentDir.x === -1) return currentDir;
            return { x: 1, y: 0 };
          default:
            return currentDir;
        }
      });
    },
    [isRunning, gameOver]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Main game loop
  useEffect(() => {
    if (!isRunning || gameOver) return;

    const intervalId = setInterval(() => {
      setSnake((prevSnake) => {
        if (prevSnake.length === 0) return prevSnake;

        const head = prevSnake[0];
        const newHead = {
          x: head.x + direction.x,
          y: head.y + direction.y,
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= BOARD_SIZE ||
          newHead.y < 0 ||
          newHead.y >= BOARD_SIZE
        ) {
          setIsRunning(false);
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        const hitSelf = prevSnake.some(
          (segment) => segment.x === newHead.x && segment.y === newHead.y
        );
        if (hitSelf) {
          setIsRunning(false);
          setGameOver(true);
          return prevSnake;
        }

        const isEating = newHead.x === food.x && newHead.y === food.y;

        // Start from current snake, add new head at the front
        const newSnake = [newHead, ...prevSnake];

        // If not eating, remove the last segment (tail) so it doesn't leave a trail
        if (!isEating) {
          newSnake.pop();
        } else {
          // Eating: grow by 1, reposition food, adjust score/speed
          setFood(getRandomFood(newSnake));
          setScore((s) => s + 1);
          if (speed > 80) {
            setSpeed((sp) => sp - 10);
          }
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(intervalId);
  }, [direction, food, isRunning, gameOver, speed]);

  const handleReset = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(getRandomFood(INITIAL_SNAKE));
    setIsRunning(false);
    setGameOver(false);
    setScore(0);
    setSpeed(250); // reset to slower speed
  };

  const renderCell = (x, y) => {
    const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
    const isHead = snake[0].x === x && snake[0].y === y;
    const isFood = food.x === x && food.y === y;

    let style = { ...cellBaseStyle };

    if (isSnake) {
      style = {
        ...style,
        background: "#22c55e",
        border: "none", // remove border for body
      };
    }

    if (isHead) {
      style = {
        ...style,
        background: "#16a34a",
        border: "none", // remove border for head too
      };
    }

    if (isFood) {
      style = {
        ...style,
        background: "#ef4444",
        border: "none", // optional: no border on food
      };
    }

    return <div key={`${x}-${y}`} style={style} />;
  };

  return (
    <div style={containerStyle}>
      <h1>React Snake</h1>

      <div style={infoBarStyle}>
        <div>Score: {score}</div>
        <div>
          Speed: {speed} ms &nbsp;|&nbsp; Length: {snake.length}
        </div>
      </div>

      <div
        style={{
          ...boardBaseStyle,
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: BOARD_SIZE }).map((_, y) =>
          Array.from({ length: BOARD_SIZE }).map((_, x) => renderCell(x, y))
        )}
      </div>

      <div style={controlsStyle}>
        {!isRunning && !gameOver && (
          <button style={buttonStyle} onClick={() => setIsRunning(true)}>
            Start
          </button>
        )}
        {isRunning && (
          <button style={buttonStyle} onClick={() => setIsRunning(false)}>
            Pause
          </button>
        )}
        <button style={buttonStyle} onClick={handleReset}>
          Reset
        </button>
      </div>

      {gameOver && <div style={gameOverStyle}>Game Over! Press Reset.</div>}

      <p style={hintStyle}>Use arrow keys to control the snake.</p>
    </div>
  );
}

function getRandomFood(snake) {
  while (true) {
    const food = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
    const onSnake = snake.some(
      (segment) => segment.x === food.x && segment.y === food.y
    );
    if (!onSnake) return food;
  }
}
