import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableNativeFeedback, TouchableWithoutFeedback, LayoutAnimation, PanResponder, PanResponderInstance, Animated, Vibration } from 'react-native';
import { useDatabase } from '../../database';
import { useDragAndDrop } from '../../components/DragAndDrop/DragAndDrop';
import { colors } from '../../variables';
import dateToInt from '../../date';

import TextInputModal from '../../components/TextInputModal/TextInputModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { Button, ExtraButton } from './RoutineBubbleButtons';

const OPEN_ICON = require("../../assets/icons/chevron_right.png");
const HIDE_ICON = require("../../assets/icons/close.png");

type RoutineBubbleProps = {
  name: string|null,
  id: number,
  scrollIndex: number,
  onChange?: () => void,
  navigation: any,
}

export default function RoutineBubble({name, id, scrollIndex, onChange, navigation}: RoutineBubbleProps) {
  // Database
  const db = useDatabase();
  // DOM(?) state of bubble
  const [routineName, setRoutineName] = useState<string|null>(name);
  const [bubbleExpanded, setBubbleExpanded] = useState<boolean>(false);
  // Modal states
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  // Drag and drop stuff
  const dragCtx = useDragAndDrop();
  const trackingTouch = useRef<boolean>(false);
  const [dragStyles, setDragStyles] = useState<boolean>(false);
  const setDragging = (value: boolean) => { dragCtx.setScrollEnabled(!value); setDragStyles(value); trackingTouch.current = value; }
  // Bubble Offset
  const touchScreenCoords = useRef({x: 0, y: 0});
  const bubbleStyleCoords = useRef(new Animated.ValueXY()).current;
  const draggingAnimationFrame = useRef<number|null>(0);
  const panResponderRef = useRef<PanResponderInstance|null>(null);
  const [panResponderMade, setPanResponderMade] = useState<boolean>(false);

  // Function for updating the DB at the end of a drag
  // Sets position of dragged bubble based on endIndex
  // Sets position of all bubbles between the where the bubble was and where it is now (in terms of position, not just index)
  const updatePositionsInDB = () => {
    if (dragCtx.currentIndex.current === scrollIndex) {
      return;
    }
    const endId = dragCtx.orderedIDs.current[dragCtx.currentIndex.current!]; // ID of the bubble we moved on top of

    db.transaction((tx) => {
    // Find the positions of this routine and the routine we just moved on top of
    tx.executeSql(
      `SELECT id, position FROM routines WHERE id = ? OR id = ?;`,
      [id, endId],
      (_, { rows: { _array } }) =>
      {
        const startPos = _array.find((routine: any) => routine.id === id).position;
        const endPos = _array.find((routine: any) => routine.id === endId).position;

        // SQLite enforces UNIQUE in real time, so I have to do this stupid dance where I
        //    - Set the position of the routine we moved to -1
        //    - Set the position of the in-betweeners to ((final * -1) -2) (so they don't conflict with the routine we moved or the one at position 0)
        //    - Set the position of the routine we moved to the actual position
        //    - Set the position of the in-betweeners to their actual positions ((old + 2) * -1)
        // This should ensure that at no point the UNIQUE constraint is violated, and that the final positions are correct, but god is this stupid.

        // Moved routine goes to temp position
        tx.executeSql(
          `UPDATE routines SET position = -1 WHERE id = ?;`,
          [id]
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
          [endPos, id]
        );

        // In betweeners go to final positions
        tx.executeSql(
          `UPDATE routines SET position = ((position + 2) * -1) WHERE position < 0;`,
          []
        );
        
        if (onChange) {
          onChange();
        }
      });
    }, (error) => console.log(error));
  }

  // All of this stuff is in some way based on the scrollIndex, so we need to update it when the scrollIndex changes
  useEffect(() => {
    // If the scrollIndex changed, then our previous coords are no longer valid
    touchScreenCoords.current = {x: 0, y: 0};
    bubbleStyleCoords.setValue({x: 0, y: 0});

    // Updates the style coordinates of the bubble while it's being dragged, based on the screen pos of the touch and the current y value of the scrollview
    // Animation is started below when this bubble is picked up, and stopped when the bubble is released.
    const updateStyleCoords = () => {
      const styleCoords = {
        x: touchScreenCoords.current.x,
        y: touchScreenCoords.current.y + (dragCtx.scrollHeight.current - dragCtx.touchHeightStart.current)
      };
      Animated.event([{
        x: bubbleStyleCoords.x,
        y: bubbleStyleCoords.y,
      }], {useNativeDriver: false}, )(styleCoords);
      draggingAnimationFrame.current = requestAnimationFrame(updateStyleCoords);
    }

    // The panResponder will continue to use the old scrollIndex even after the rerender since it's stored in a reference, so we need to update it
    panResponderRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: () => trackingTouch.current,
  
      onPanResponderGrant: () => {
        dragCtx.startIndex.current = scrollIndex;
        dragCtx.prevIndex.current = scrollIndex;
        dragCtx.currentIndex.current = scrollIndex;
        dragCtx.touchHeightStart.current = dragCtx.scrollHeight.current;
        draggingAnimationFrame.current = requestAnimationFrame(updateStyleCoords);
      },
  
      onPanResponderMove: (e, gestureState) => {
        // dragCtx is responsible for determining if the scrollView should be scrolled up/down depending on screen coordinates of touch
        dragCtx.updateEdgeScrolling(gestureState.dy + gestureState.y0);
        // Save screen coordinates of touch
        touchScreenCoords.current = {x: gestureState.dx, y: gestureState.dy};
      },
  
      onPanResponderEnd: () => {
        setDragging(false);
        dragCtx.updateEdgeScrolling(300);
        cancelAnimationFrame(draggingAnimationFrame.current!);
  
        // When letting go, make bubble snap to the index it is closest to
        // DB gets updated once this animation finishes, since by then all animations should be done.
        Animated.timing(
          bubbleStyleCoords,
          {toValue: {x: 0, y: dragCtx.bubbleHeight.current * (dragCtx.currentIndex.current! - scrollIndex)}, duration: 200, useNativeDriver: true}
        ).start(updatePositionsInDB);
      },
    });
    // After the panResponder gets made, we need to rerender since the first render gets skipped (see below)
    if (!panResponderMade)
      setPanResponderMade(true);
    
    // The drag evasion logic is based on the scrollIndex, so the listener needs to be updated
    const evasionListenerdId = dragCtx.addListener((startIndex: number, prevIndex: number, currentIndex: number) => {
      if (startIndex === scrollIndex) { // This bubble is being dragged, so no need to evade
        return;
      }

      type MovementState = 'still' | 'avoiding_up' | 'avoiding_down' | 'returning';

      const BubbleUp = () => Animated.timing(bubbleStyleCoords, {toValue: {x: 0, y: -dragCtx.bubbleHeight.current}, duration: 200, useNativeDriver: true}).start();
      const BubbleReturn = () => Animated.timing(bubbleStyleCoords, {toValue: {x: 0, y: 0}, duration: 200, useNativeDriver: true}).start();
      const BubbleDown = () => Animated.timing(bubbleStyleCoords, {toValue: {x: 0, y: dragCtx.bubbleHeight.current}, duration: 200, useNativeDriver: true}).start();

      let movement: MovementState = 'still';
      if (startIndex < scrollIndex && currentIndex >= scrollIndex && !(prevIndex >= scrollIndex)) // It started above me, but is now at/below me, and it wasn't there before
        movement = 'avoiding_up';
      else if (startIndex > scrollIndex && currentIndex <= scrollIndex && !(prevIndex <= scrollIndex)) // It started below me, but is now at/above me, and it wasn't there before
        movement = 'avoiding_down';
      else if (startIndex < scrollIndex && currentIndex < scrollIndex && !(prevIndex < scrollIndex)) // It started above me, and is now above me, and it wasn't there before
        movement = 'returning';
      else if (startIndex > scrollIndex && currentIndex > scrollIndex && !(prevIndex > scrollIndex)) // It started below me, and is now below me, and it wasn't there before
        movement = 'returning';
      
      if (movement === 'avoiding_up')
        BubbleUp();
      else if (movement === 'avoiding_down')
        BubbleDown();
      else if (movement === 'returning')
        BubbleReturn();
    });

    // Similarly, the listener for the index broadcaster wikll be out of date 
    const indexBroadcasterListenerId = bubbleStyleCoords.y.addListener(({value}) => {
      // If this is the dragged bubble, the listener reads the value of the bubble offset, calculates the index it should snap to, and updates the indices in the dragCtx
      // Values will only be updated if the bubble is actaully being dragged

      // No bubble is being dragged, so no need to update indices
      if (!trackingTouch.current) return;
      // I'm not the one being dragged, so I don't do the updating
      if (scrollIndex !== dragCtx.startIndex.current!) return;
  
      // Calculate the index the bubble should snap to
      const int_pos = Math.floor(value / (dragCtx.bubbleHeight.current));
      const rel_idx = int_pos + (int_pos < 0 ? 1 : 0);
      const idx = Math.max(0, Math.min(dragCtx.orderedIDs.current.length - 1, scrollIndex + rel_idx));
  
      // Update the indices in the dragCtx if they have changed
      if (idx !== dragCtx.currentIndex.current) {
        dragCtx.prevIndex.current = dragCtx.currentIndex.current;
        dragCtx.currentIndex.current = idx;
        // Notify the other bubbles that the indices have changed, so they can update their offsets
        dragCtx.notifyListeners();
      }
    });

    // The listeners need to be removed the next time this effect runs
    return () => {
      dragCtx.removeListener(evasionListenerdId);
      bubbleStyleCoords.y.removeListener(indexBroadcasterListenerId);
    };
  },
  [scrollIndex]);
 
  // Leaving all of these utility functions in one place. They're only referenced once anyways, and it makes it easier to hide them when I don't care about them.
  const bubbleUtils = {
    handleUpdateName: (text: string) => {
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
    },

    handleDeleteBubble: () => {
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
    },

    handleHideRoutine: () => {
      const today = dateToInt(new Date());
      db.transaction((tx) => {
        tx.executeSql(`UPDATE routines SET hidden = ? WHERE id = ?;`, [today, id]);
      })
      if (onChange !== undefined) {
        onChange();
      }
    },

    handleOpenRoutine: () => {
      navigation.navigate('Tasks', {routine_id: id, routine_name: routineName});
    }
  }

  // Wait until the pan responder has been made, then rerender, to ensure that the Animated.View doesn't get passed a null
  if (!panResponderMade) {
    return <></>;
  }
  
  return (
    <>
    <TextInputModal
      visible={editModalVisible}
      msg='Routine Name'
      handleCancel={() => setEditModalVisible(false)}
      handleConfirm={bubbleUtils.handleUpdateName}
    />

    <ConfirmModal
      visible={deleteModalVisible}
      msg='Are you sure you want to delete this routine? All tasks inside will be permanently deleted as well'
      handleCancel={() => setDeleteModalVisible(false)}
      handleConfirm={bubbleUtils.handleDeleteBubble}
      confirmColor={colors.grey}
    />

    <Animated.View
      {...panResponderRef.current!.panHandlers}
      style={[
        styles.container,
        {
          transform: [{translateX: bubbleStyleCoords.x}, {translateY: bubbleStyleCoords.y}],
          backgroundColor: dragStyles ? colors.bubble_highlighted_grey : colors.bubble_grey,
          zIndex: dragStyles ? 1 : 0
        }
      ]}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        if (height + 8 < dragCtx.bubbleHeight.current) {
          dragCtx.bubbleHeight.current = height + 8;
        }
      }}
    >
      <TouchableWithoutFeedback
        onLongPress={() => {
          setDragging(true);
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
              onPress={bubbleUtils.handleHideRoutine}
            />
            <Button
              label={'Open'}
              icon={OPEN_ICON}
              color={colors.blue}
              style={{alignItems:'center'}}
              onPress={bubbleUtils.handleOpenRoutine}
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
    </Animated.View>
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