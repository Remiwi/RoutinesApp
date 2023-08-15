import { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { useDatabase } from '../../database';
import date_to_int from '../../date';
import { colors } from '../../variables';

import RoutineBubble from './RoutineBubble';
import Title from '../../components/Title/Title';
import TextInputModal from '../../components/TextInputModal/TextInputModal';
import { DragAndDropScrollView } from '../../components/DragAndDrop/DragAndDrop';

export default function Routines({ navigation }: any) {
  // Database
  const db = useDatabase();
  // DOM State
  const [routines, setRoutines] = useState<any[]>([]); 
  // Modals
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [addErrorMsg, setAddErrorMsg] = useState<string>('');


  const updateRoutines = () => {
    const date = date_to_int(new Date());
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM routines WHERE hidden != ? ORDER BY position ASC;`,
        [date],
        (_, { rows: { _array } }) => setRoutines(_array)
      );
    })
  };

  // Get routines from database
  useEffect(() => {
    updateRoutines();
  }, []);

  // Add routine stuff
  const handleOpenModal = () => {
    setAddModalVisible(true);
  };

  const handleCancelModal = () => {
    setAddModalVisible(false);
    setAddErrorMsg('');
  };

  const handleConfirmModal = (text: string) => {
    if (text === '') {
      setAddErrorMsg('New routine must be given a name');
    }
    else {
      // get number of routines
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT COUNT(*) FROM routines;`,
          [],
          (_, { rows: { _array } }) => {
            const num_routines = _array[0]['COUNT(*)'];
            tx.executeSql(
              `INSERT INTO routines (position, name) VALUES (?, ?);`,
              [num_routines, text]
            );
          }
        )
      });
      updateRoutines();
      setAddModalVisible(false);
      setAddErrorMsg('');
    }
  }

  // Unhide all routines
  const handleUnhideAll = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE routines SET hidden = 0;`,
        []
      );
    })
    updateRoutines();
  }

  // Function for updating the DB at the end of a drag
  // Sets position of dragged bubble based on endIndex
  // Sets position of all bubbles between the where the bubble was and where it is now (in terms of position, not just index)
  const moveBubbles = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex)
      return;
    
    const startId = routines[startIndex].id;
    const startPos = routines[startIndex].position;
    const endPos = routines[endIndex].position;

    db.transaction((tx) => {
      // SQLite enforces UNIQUE in real time, so I have to do this stupid dance where I
      //    - Set the position of the routine we moved to -1
      //    - Set the position of the in-betweeners to ((final * -1) -2) (so they don't conflict with the routine we moved or the one at position 0)
      //    - Set the position of the routine we moved to the actual position
      //    - Set the position of the in-betweeners to their actual positions ((old + 2) * -1)
      // This should ensure that at no point the UNIQUE constraint is violated, and that the final positions are correct, but god is this stupid.

      // Moved routine goes to temp position
      tx.executeSql(
        `UPDATE routines SET position = -1 WHERE id = ?;`,
        [startId]
      );

      // In-betweeners go to temp positions
      if (endPos < startPos) {
        // endPos is above startPos, so move all routines between them down one
        tx.executeSql(
          `UPDATE routines SET position = ((position + 1) * -1) - 2 WHERE position >= ? AND position < ?;`,
          [endPos, startPos]
        );
      } else {
        // endPos is below startPos, so move all routines between them up one
        tx.executeSql(
          `UPDATE routines SET position = ((position - 1) * -1) - 2 WHERE position > ? AND position <= ?;`,
          [startPos, endPos]
        );
      }

      // Moved routine goes to final position
      tx.executeSql(
        `UPDATE routines SET position = ? WHERE id = ?;`,
        [endPos, startId]
      );

      // In betweeners go to final positions
      tx.executeSql(
        `UPDATE routines SET position = ((position + 2) * -1) WHERE position < 0;`,
        [],
        () => { updateRoutines();}
      );
    }, (error) => console.log(error));
  }

  return (
    <>
      <TextInputModal
        visible={addModalVisible}
        msg='Routine Name'
        handleCancel={handleCancelModal}
        handleConfirm={handleConfirmModal}
        errorMsg={addErrorMsg}
      ></TextInputModal>

      <View style={{flex: 1, backgroundColor: colors.background_grey}}>
        <Title
          title="Routines"
          onPressAdd={handleOpenModal}
          buttons={[
            {
              label: 'Unhide All',
              onPress: handleUnhideAll
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
          {routines.map((routine: any, index: number) => {
            return <RoutineBubble
              name={routine.name}
              id={routine.id}
              index={index}
              key={routine.id}
              onChange={updateRoutines}
              onMove={moveBubbles}
              navigation={navigation}
            />
          })}
        </DragAndDropScrollView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
    bubble_container: {
      flexDirection: 'column',
      padding: 15,
      gap: 8,
      flexGrow: 1
    },
  });