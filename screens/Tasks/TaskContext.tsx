import { useState, useEffect, useContext, createContext } from "react";
import { useDatabase } from "../../database";
import { intToDateLocal, getToday } from "../../date";

type TaskData = {
  routine_id: number;
  id: number;
  name: string;
  entries: Map<number, number>;
  updateEntries: () => void;
  changeEntry: (date: number, value: number) => void;
};

const TaskContext = createContext<TaskData | null>(null);

type TaskContextProviderProps = {
  routine_id: number;
  id: number;
  name: string;

  initialEntries?: Map<number, number>;

  children: React.ReactNode;
};

export function TaskContextProvider(props: TaskContextProviderProps) {
  const db = useDatabase();

  const initialEntries =
    props.initialEntries === undefined ? new Map() : props.initialEntries;
  const [entries, setEntries] = useState<Map<number, number>>(initialEntries);
  const [dummy, setDummy] = useState(false);

  const updateEntries = () =>
    db.transaction((tx) => {
      tx.executeSql(
        `
        SELECT date, value
        FROM entries
        WHERE
          task_id = ?
      `,
        [props.id],
        (_, { rows }) => {
          const newEntries = new Map<number, number>();
          for (let i = 0; i < rows.length; i++)
            newEntries.set(rows.item(i).date, rows.item(i).value);
          setEntries(newEntries);
        }
      );
    });

  useEffect(() => {
    if (props.initialEntries === undefined) updateEntries();
  }, []);

  const changeEntry = (date: number, value: number) => {
    db.transaction((tx) => {
      tx.executeSql(
        `
        INSERT OR REPLACE INTO entries (task_id, date, value)
        VALUES (?, ?, ?)
      `,
        [props.id, date, value],
        undefined,
        (_, error) => {
          console.log(error);
          return false;
        }
      );
    });

    entries.set(date, value);
    setDummy(!dummy);
  };

  return (
    <TaskContext.Provider
      value={{
        routine_id: props.routine_id,
        id: props.id,
        name: props.name,

        entries: entries,
        updateEntries: updateEntries,
        changeEntry: changeEntry,
      }}
    >
      {props.children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === null)
    throw new Error("useTaskContext must be used within a TaskContextProvider");
  return context;
}
