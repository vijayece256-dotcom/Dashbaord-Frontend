
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { COLUMNS } from "../data/columns.js";
import { currentUser } from "../data/currentUser.js";

const BoardsContext = createContext(null);

const STORAGE_KEY = "baluns_boards";
const COUNTER_KEY = "baluns_task_counter";

const VALID_IDS = COLUMNS.map((c) => c.id);
const FIRST_COLUMN = COLUMNS[0].id;

// -----------------------------------------
// GENERATE UNIQUE INTERNAL ID
// -----------------------------------------

const newId = () =>
  Date.now().toString(36) +
  Math.random().toString(36).slice(2, 5);

// -----------------------------------------
// TASK NUMBER HELPERS
// -----------------------------------------

const validTaskNumber = (value) => {
  const number = Number(value);

  return Number.isSafeInteger(number) && number > 0
    ? number
    : null;
};

const formatTaskNumber = (number) =>
  `#${String(number).padStart(3, "0")}`;

// -----------------------------------------
// LOAD BOARDS + MIGRATE OLD TASKS
// -----------------------------------------

function loadInitialData() {
  let storedBoards = [];
  let storedCounter = 0;

  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    storedBoards = Array.isArray(parsed)
      ? parsed
      : [];

    storedCounter =
      Number(localStorage.getItem(COUNTER_KEY)) || 0;
  } catch (error) {
    console.error("Failed to load boards:", error);
  }

  const usedNumbers = new Set();

  let highestNumber = Math.max(0, storedCounter);

  // First, reserve all valid existing task numbers.
  // This prevents older tasks from taking a newer
  // task's already assigned number.

  storedBoards.forEach((board) => {
    (board.tasks || []).forEach((task) => {
      const number = validTaskNumber(task.taskNumber);

      if (number && !usedNumbers.has(number)) {
        usedNumbers.add(number);
        highestNumber = Math.max(
          highestNumber,
          number
        );
      }
    });
  });

  const assignedNumbers = new Set();

  // Assign numbers to old tasks without one,
  // and repair any duplicate task numbers.

  const boards = storedBoards.map((board) => ({
    ...board,

    tasks: (board.tasks || []).map((task) => {
      let taskNumber = validTaskNumber(
        task.taskNumber
      );

      if (
        !taskNumber ||
        assignedNumbers.has(taskNumber)
      ) {
        highestNumber += 1;
        taskNumber = highestNumber;
      }

      assignedNumbers.add(taskNumber);

      return {
        ...task,

        taskNumber,

        status: VALID_IDS.includes(task.status)
          ? task.status
          : FIRST_COLUMN,
      };
    }),
  }));

  return {
    boards,
    counter: highestNumber,
  };
}

// -----------------------------------------
// BOARDS PROVIDER
// -----------------------------------------

export function BoardsProvider({ children }) {
  const initialData = useRef(null);

  if (initialData.current === null) {
    initialData.current = loadInitialData();
  }

  const [boards, setBoards] = useState(
    initialData.current.boards
  );

  const taskCounter = useRef(
    initialData.current.counter
  );

  // -----------------------------------------
  // SAVE DATA TO LOCAL STORAGE
  // -----------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(boards)
      );

      localStorage.setItem(
        COUNTER_KEY,
        String(taskCounter.current)
      );
    } catch (error) {
      console.error("Failed to save boards:", error);

      alert(
        "Browser storage is full. Remove some screenshots from tasks."
      );
    }
  }, [boards]);

  // -----------------------------------------
  // GET NEXT TASK NUMBER
  // -----------------------------------------

  const getNextTaskNumber = () => {
    taskCounter.current += 1;

    const number = taskCounter.current;

    // Persist immediately so deleting a task
    // does not cause its number to be reused.

    try {
      localStorage.setItem(
        COUNTER_KEY,
        String(number)
      );
    } catch (error) {
      console.error(
        "Failed to save task counter:",
        error
      );
    }

    return number;
  };

  // -----------------------------------------
  // ADD BOARD
  // -----------------------------------------

  const addBoard = (name) => {
    const board = {
      id: newId(),
      name: name.trim(),
      tasks: [],
    };

    setBoards((previous) => [
      ...previous,
      board,
    ]);

    return board;
  };

  // -----------------------------------------
  // UPDATE BOARD TASKS
  // -----------------------------------------

  const updateTasks = (boardId, fn) => {
    setBoards((previous) =>
      previous.map((board) =>
        board.id === boardId
          ? {
              ...board,
              tasks: fn(board.tasks || []),
            }
          : board
      )
    );
  };

  // -----------------------------------------
  // CREATE TASK
  // -----------------------------------------

  const addTask = (boardId, data) => {
    const taskNumber = getNextTaskNumber();

    const newTask = {
      ...data,

      id: newId(),

      taskNumber,

      status: FIRST_COLUMN,

      comments: [],

      createdBy: currentUser.name,

      createdAt: new Date().toISOString(),
    };

    updateTasks(boardId, (tasks) => [
      ...tasks,
      newTask,
    ]);

    return newTask;
  };

  // -----------------------------------------
  // UPDATE TASK
  // -----------------------------------------

  const updateTask = (
    boardId,
    taskId,
    changes
  ) => {
    const {
      id: ignoredId,
      taskNumber: ignoredNumber,
      ...safeChanges
    } = changes;

    updateTasks(boardId, (tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...safeChanges,
            }
          : task
      )
    );
  };

  // -----------------------------------------
  // MOVE TASK
  // -----------------------------------------

  const moveTask = (
    boardId,
    taskId,
    status
  ) => {
    updateTask(boardId, taskId, {
      status,
    });
  };

  // -----------------------------------------
  // DELETE TASK
  // -----------------------------------------

  const deleteTask = (
    boardId,
    taskId
  ) => {
    updateTasks(boardId, (tasks) =>
      tasks.filter(
        (task) => task.id !== taskId
      )
    );
  };

  // -----------------------------------------
  // ADD COMMENT
  // -----------------------------------------

  const addComment = (
    boardId,
    taskId,
    comment
  ) => {
    updateTasks(boardId, (tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,

              comments: [
                ...(task.comments || []),

                {
                  ...comment,

                  id: newId(),

                  createdAt:
                    new Date().toISOString(),
                },
              ],
            }
          : task
      )
    );
  };

  // -----------------------------------------
  // EDIT COMMENT
  // -----------------------------------------

  const editComment = (
    boardId,
    taskId,
    commentId,
    text
  ) => {
    updateTasks(boardId, (tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,

              comments: (
                task.comments || []
              ).map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,

                      text,

                      editedAt:
                        new Date().toISOString(),
                    }
                  : comment
              ),
            }
          : task
      )
    );
  };

  // -----------------------------------------
  // CONTEXT VALUES
  // -----------------------------------------

  return (
    <BoardsContext.Provider
      value={{
        boards,
        addBoard,
        addTask,
        updateTask,
        moveTask,
        deleteTask,
        addComment,
        editComment,
        formatTaskNumber,
      }}
    >
      {children}
    </BoardsContext.Provider>
  );
}

// -----------------------------------------
// CUSTOM HOOK
// -----------------------------------------

export const useBoards = () =>
  useContext(BoardsContext);
