import { useState, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableNativeFeedback, TouchableWithoutFeedback, LayoutAnimation, Vibration } from 'react-native';
import { useDatabase } from '../../database';
import { colors } from '../../variables';
import dateToInt from '../../date';

import TextInputModal from '../../components/TextInputModal/TextInputModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { Button, ExtraButton } from './RoutineBubbleButtons';
import { DragAndDropItem } from '../../components/DragAndDrop/DragAndDrop';

const OPEN_ICON = require("../../assets/icons/chevron_right.png");
const HIDE_ICON = require("../../assets/icons/close.png");

type RoutineBubbleProps = {
  name: string|null,
  id: number,
  index: number,
  onChange?: () => void,
  onMove: (startIndex: number, endIndex: number) => void,
  navigation: any,
}

export default function RoutineBubble({name, id, index, onChange, onMove, navigation}: RoutineBubbleProps) {
  // Database
  const db = useDatabase();
  // DOM(?) state of bubble
  const [routineName, setRoutineName] = useState<string|null>(name);
  const [bubbleExpanded, setBubbleExpanded] = useState<boolean>(false);
  // Modal states
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  // Drag and Drop
  const startDragRef = useRef<() => void>(() => {});

  const handleUpdateName = (text: string) => {
    if (text != '') {
      db.transaction((tx) => {
        tx.executeSql(
          `UPDATE routines SET name = ? WHERE id = ?;`,
          [text, id]
        );
      });
      setRoutineName(text);
    }
    setEditModalVisible(false);
  }

  const handleDeleteBubble = () => {
    db.transaction((tx) => {
      // get position of bubble with this id
      tx.executeSql(`SELECT position FROM routines WHERE id = ?;`, [id], (_, {rows}) => {
        const pos = rows.item(0).position;

        tx.executeSql(`DELETE FROM routines WHERE id = ?;`, [id]);
        // Stupid dance again
        tx.executeSql(`UPDATE routines SET position = position * -1 WHERE position > ?;`, [pos]);
        tx.executeSql(`UPDATE routines SET position = (position * -1) - 1 WHERE position < 0;`);
      });
    }, (err) => console.log(err));
    setDeleteModalVisible(false);
    if (onChange !== undefined) {
      onChange();
    }
  }

  const handleHideRoutine = () => {
    const today = dateToInt(new Date());
    db.transaction((tx) => {
      tx.executeSql(`UPDATE routines SET hidden = ? WHERE id = ?;`, [today, id]);
    })
    if (onChange !== undefined) {
      onChange();
    }
  }

  const handleOpenRoutine = () => {
    navigation.navigate('Tasks', {routine_id: id, routine_name: routineName});
  }

  return (
    <>
    <TextInputModal
      visible={editModalVisible}
      msg='Routine Name'
      handleCancel={() => setEditModalVisible(false)}
      handleConfirm={handleUpdateName}
    />

    <ConfirmModal
      visible={deleteModalVisible}
      msg='Are you sure you want to delete this routine? All tasks inside will be permanently deleted as well'
      handleCancel={() => setDeleteModalVisible(false)}
      handleConfirm={handleDeleteBubble}
      confirmColor={colors.grey}
    />

    <DragAndDropItem
      itemIndex={index}
      startDragRef={startDragRef}
      onDragFinished={onMove}
      contentContainerStyle={styles.container}
      contentContainerStyleSelected={styles.selected}
    >
      <TouchableWithoutFeedback
        style={{flex: 1}}
        onLongPress={() => {
          if (bubbleExpanded) return;
          startDragRef.current();
          Vibration.vibrate(10);
        }}
      >
        <View style={styles.mainContainer}>
          {/* Top*/}
          <View style={styles.top}>
            <TouchableNativeFeedback onPress={() => setEditModalVisible(true)}>
              <Text style={styles.title}>{routineName}</Text>
            </TouchableNativeFeedback>
            <View style={[styles.expand_button, {overflow: 'hidden'}]}>
              <TouchableNativeFeedback onPress={() => {
                LayoutAnimation.configureNext({
                  duration: 70,
                  update: {type: 'linear', property: 'scaleY', delay: 1},
                  create: {type: 'linear', property: 'opacity', delay: 51, duration: 1},
                  delete: {type: 'linear', property: 'opacity', duration: 1},
                });
                setBubbleExpanded(!bubbleExpanded);
              }}>
                <View style={[styles.expand_button, {top: (bubbleExpanded ? -1 : 1)}]}>
                  <Image source={bubbleExpanded ? require("../../assets/icons/chevron_up.png") : require("../../assets/icons/chevron_down.png")} style={styles.expand_icon}></Image>
                </View>
              </TouchableNativeFeedback>
            </View>
          </View>
          {/* Buttons */}
          <View style={styles.buttons_container}>
            <View style={{flex: 1, alignItems: 'baseline'}}>
              <Button label={'Streak'} icon={null} color={colors.grey} style={{alignItems: 'center'}}></Button>
            </View>
            <Button
              label={'Hide'}
              icon={HIDE_ICON}
              color={colors.grey}
              style={{alignItems:'center'}}
              onPress={handleHideRoutine}
            />
            <Button
              label={'Open'}
              icon={OPEN_ICON}
              color={colors.blue}
              style={{alignItems:'center'}}
              onPress={handleOpenRoutine}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      {/* Extra Buttons */
        bubbleExpanded &&
        <View style={styles.extraButtonsContainer}>
          <ExtraButton label={'Delete'} icon={require("../../assets/icons/trash.png")} onPress={() => setDeleteModalVisible(true)}></ExtraButton>
        </View>
      }
    </DragAndDropItem>
    </>
  )
}



const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bubble_grey,
    borderRadius: 26,
    paddingTop: 15,
    paddingBottom: 5
  },
  selected: {
    backgroundColor: colors.bubble_highlighted_grey,
    zIndex: 1
  },
  mainContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'notoSansRegular',
    width: '40%',
  },
  expand_button: {
    width: 22,
    height: 22,
    backgroundColor: colors.button_grey,
    borderRadius: 500000,
    justifyContent: 'center',
    alignItems: 'center'
  },
  expand_icon: {
    tintColor: colors.white,
    width: 24,
    height: 24,
  },
  buttons_container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap:24,
    paddingTop: 2,
    paddingBottom: 5
  },
  extraButtonsContainer: {
    flexDirection: 'column',
    padding: 10,
    gap: 1
  },
});