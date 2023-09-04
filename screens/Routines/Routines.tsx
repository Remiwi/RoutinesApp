import { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useDatabase } from "../../database";
import JustDate from "../../JustDate";
import { colors } from "../../variables";

import RoutineBubble from "./RoutineBubble";
import Title from "../../components/Title/Title";
import TextInputModal from "../../components/TextInputModal/TextInputModal";
import { DragAndDropScrollView } from "../../components/DragAndDrop/DragAndDrop";

export default function Routines({ navigation }: any) {
  // Database
  const db = useDatabase();
  // DOM State
  const [routineData, setRoutineData] = useState<any[]>([]);
  // Modals
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [addErrorMsg, setAddErrorMsg] = useState<string>("");

  const updateRoutineData = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM routines WHERE hidden != ? ORDER BY position ASC;`,
        [JustDate.today().toInt()],
        (_, { rows: { _array } }) => setRoutineData(_array)
      );
    });
  };

  // Get routines from database
  useEffect(() => {
    updateRoutineData();
  }, []);

  // Add routine stuff
  const handleAddCancel = () => {
    setAddModalVisible(false);
    setAddErrorMsg("");
  };

  const handleAddConfirm = (text: string) => {
    if (text === "") {
      setAddErrorMsg("New routine must be given a name");
    } else {
      // get number of routines
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT COUNT(*) FROM routines;`,
          [],
          (_, { rows: { _array } }) => {
            const num_routines = _array[0]["COUNT(*)"];
            tx.executeSql(
              `INSERT INTO routines (position, name) VALUES (?, ?);`,
              [num_routines, text]
            );
          }
        );
      });
      updateRoutineData();
      setAddModalVisible(false);
      setAddErrorMsg("");
    }
  };

  // Unhide all routines
  const handleUnhideAll = () => {
    db.transaction((tx) => {
      tx.executeSql(`UPDATE routines SET hidden = 0;`, []);
    });
    updateRoutineData();
  };

  // Moving bubbles after drag and drop
  // Moves bubble at startIndex to endIndex, and bumps betweeners either up or down depending on, opposite the direction the dragged bubble went
  const moveBubbles = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;

    const startId = routineData[startIndex].id;
    const startPos = routineData[startIndex].position;
    const endPos = routineData[endIndex].position;

    db.transaction(
      (tx) => {
        // Update positions
        tx.executeSql(
          `
        UPDATE routines SET position = CASE
            WHEN id = ? THEN ?
            WHEN position BETWEEN ? AND ? THEN position - 1
            WHEN position BETWEEN ? AND ? THEN position + 1
            ELSE position
          END;
      `,
          [startId, endPos, startPos + 1, endPos, endPos, startPos - 1]
        );

        // Update prev_positions. Effectively allows the UNIQUE(position, routine_id) to be enforced.
        tx.executeSql(
          `UPDATE routines SET prev_position = position WHERE prev_position != position;`,
          [],
          () => updateRoutineData()
        );
      },
      (e) => {
        console.log(e);
      }
    );
  };

  return (
    <>
      <TextInputModal
        visible={addModalVisible}
        msg="Routine Name"
        handleCancel={handleAddCancel}
        handleConfirm={handleAddConfirm}
        errorMsg={addErrorMsg}
      ></TextInputModal>

      <View style={{ flex: 1, backgroundColor: colors.background_grey }}>
        <Title
          title="Routines"
          onPressAdd={() => setAddModalVisible(true)}
          buttons={[
            {
              label: "Unhide All",
              onPress: handleUnhideAll,
            },
          ]}
        />
        <DragAndDropScrollView
          upperDivingThreshold={150}
          lowerDivingThreshold={150}
          maxDivingSpeed={20}
          evasionAnimationDuration={200}
          droppingAnimationDuration={200}
          itemGap={8}
          contentContainerStyle={styles.bubble_container}
        >
          {routineData.map((routine: any, index: number) => {
            return (
              <RoutineBubble
                name={routine.name}
                id={routine.id}
                index={index}
                key={routine.id}
                onChange={updateRoutineData}
                onMove={moveBubbles}
                navigation={navigation}
              />
            );
          })}
        </DragAndDropScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bubble_container: {
    flexDirection: "column",
    padding: 15,
    gap: 8,
    flexGrow: 1,
  },
});
