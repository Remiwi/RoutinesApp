import React, { useRef } from 'react';
import { StyleSheet, Text, View, Image, Vibration, Animated, PanResponder, TouchableWithoutFeedback } from 'react-native';
import { colors } from '../../variables';

import { DragAndDropItem } from '../../components/DragAndDrop/DragAndDrop';

const CIRCLE_EMPTY = require('../../assets/icons/circle_empty.png');
const CIRCLE_HALF = require('../../assets/icons/circle_half.png');
const CIRCLE_FULL = require('../../assets/icons/circle_full.png');

type TaskBubbleProps = {
  taskName: string,
  index: number
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>,
  onDragFinished: (startIndex: number, endIndex: number) => void
}

export default function TaskBubble({taskName, index, setScrollEnabled, onDragFinished }: TaskBubbleProps) {
  // Sliding
  const slideOffset: Animated.Value = useRef(new Animated.Value(0)).current;
  const slideEnabled = useRef(true);
  // Drag and Drop
  const startDragRef = useRef<() => void>(() => {});
  const [dragStylesEnabled, setDragStylesEnabled] = React.useState(false);

  const panResponderRef = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 50 && slideEnabled.current;
    },
    onPanResponderGrant: () => {
      setScrollEnabled(false);
    },
    onPanResponderMove: Animated.event([null, {dx: slideOffset}], {useNativeDriver: false}),
    onPanResponderEnd: () => {
      Animated.spring(slideOffset, {toValue: 0, useNativeDriver: true}).start();
      setScrollEnabled(true);
    }
  }));

  return (
    <DragAndDropItem
      itemIndex={index}
      startDragRef={startDragRef}
      onDragFinishing={() => setDragStylesEnabled(false)}
      onDragFinished={(startIndex: number, endIndex: number) => {
        slideEnabled.current = true;
        onDragFinished(startIndex, endIndex);
      }}
      contentContainerStyleSelected={{zIndex: 1}}
    >
      <Animated.View
        style={[
          styles.taskContainer,
          dragStylesEnabled? styles.taskContainerSelected : {},
          {transform: [{translateX: slideOffset}]},
        ]}
        {...panResponderRef.current.panHandlers}
      >
        <TouchableWithoutFeedback
          style={{flex:1}}
          onLongPress={() => {
            startDragRef.current();
            Vibration.vibrate(10);
            slideEnabled.current = false;
            setDragStylesEnabled(true);
          }}
        >
          <View style={styles.taskContent}>
            <Text style={styles.taskName}>{taskName}</Text>
            <View style={styles.entriesContainer}>
              <Entry entry={'full'}/>
              <Entry entry={'half'}/>
              <Entry entry={'empty'}/>
              <Entry entry={'empty'}/>
              <Entry entry={'empty'}/>
              <Entry entry={'empty'}/>
              <Entry entry={'empty'}/>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </DragAndDropItem>
  )
}

type EntryProps = {
  entry: 'empty' | 'half' | 'full'
}

function Entry({entry}: EntryProps) {
  return (
    <Image source={
      entry === 'empty' ? CIRCLE_EMPTY : entry === 'half' ? CIRCLE_HALF : CIRCLE_FULL}
      style={[styles.entry, {tintColor: entry !== 'empty' ? colors.blue : colors.away_grey}]}
    ></Image>
  )
}

const styles = StyleSheet.create({
  taskContainer: {
    width: '100%',
    height: 50,
    backgroundColor: colors.bubble_grey,
    borderRadius: 500000,
  },
  taskContainerSelected: {
    backgroundColor: colors.bubble_highlighted_grey,
    zIndex: 1
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
  },
  taskName: {
    fontFamily: 'notoSansRegular',
    fontSize: 12,
    color: colors.white,
    bottom: 1,
    width: '34%'
  },
  entriesContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 15,
  },
  entry: {
    width: 24,
    height: 24,
    tintColor: colors.away_grey,
  },
});