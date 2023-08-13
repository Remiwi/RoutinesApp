import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useDatabase } from '../../database';
import { DragAndDropProvider, useDragAndDrop } from '../../components/DragAndDrop/DragAndDrop';
import date_to_int from '../../date';
import { colors } from '../../variables';

import RoutineBubble from './RoutineBubble';
import Title from '../../components/Title/Title';
import TextInputModal from '../../components/TextInputModal/TextInputModal';

export default function Routines({ navigation }: any) {
  return (
    <DragAndDropProvider>
      <RoutinesWithContext navigation={navigation}/>
    </DragAndDropProvider>
  )
}

function RoutinesWithContext({ navigation }: any) {
  const db = useDatabase();

  const [routines, setRoutines] = useState<object[]>([]); 
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [addErrorMsg, setAddErrorMsg] = useState<string>('');
  const {scrollEnabled} = useDragAndDrop();

  const { orderedIDs } = useDragAndDrop();
  useEffect(() => {
    // Set to the ids of the routines that are not hidden
    orderedIDs.current = routines.filter((routine: any) => routine.hidden !== date_to_int(new Date())).map((routine: any) => routine.id);
  }, [routines]);

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
        <ScrollView
          contentContainerStyle={styles.routine_bubbles}
          scrollEnabled={scrollEnabled}
        >
          {routines.map((routine: any, index: number) => {
            if (routine.hidden === date_to_int(new Date())) {
              return null;
            }
            return <RoutineBubble
              name={routine.name}
              id={routine.id}
              scrollIndex={index}
              key={routine.id}
              onChange={updateRoutines}
              navigation={navigation}
            />
          })}
        </ScrollView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
    routine_bubbles: {
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 15,
      gap: 8,
    },
  });