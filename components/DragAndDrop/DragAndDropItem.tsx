import { useState, useRef, useEffect } from 'react';
import { TouchableWithoutFeedback, PanResponder, PanResponderInstance, Animated, Vibration } from 'react-native';
import { useDatabase } from '../../database';
import { useDragAndDrop } from '../../components/DragAndDrop/DragAndDrop';
import { colors } from '../../variables';

type DragAndDropItemProps = {
  itemIndex: number,
  onDragStarted?: () => void,
  onDragFinished?: () => void,

  
  contentContainerStyles: any[],
  children?: React.ReactNode,
}

export default function DragAndDropItem({itemIndex, onDragStarted, onDragFinished, contentContainerStyles, children}: DragAndDropItemProps) {
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
        dragCtx.startIndex.current = itemIndex;
        dragCtx.prevIndex.current = itemIndex;
        dragCtx.currentIndex.current = itemIndex;
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
          {toValue: {x: 0, y: dragCtx.bubbleHeight.current * (dragCtx.currentIndex.current! - itemIndex)}, duration: 200, useNativeDriver: true}
        ).start(onDragFinished);
      },
    });
    // After the panResponder gets made, we need to rerender since the first render gets skipped (see below)
    if (!panResponderMade)
      setPanResponderMade(true);
    
    // The drag evasion logic is based on the scrollIndex, so the listener needs to be updated
    const evasionListenerdId = dragCtx.addListener((startIndex: number, prevIndex: number, currentIndex: number) => {
      if (startIndex === itemIndex) { // This bubble is being dragged, so no need to evade
        return;
      }

      type MovementState = 'still' | 'avoiding_up' | 'avoiding_down' | 'returning';

      const BubbleUp = () => Animated.timing(bubbleStyleCoords, {toValue: {x: 0, y: -dragCtx.bubbleHeight.current}, duration: 200, useNativeDriver: true}).start();
      const BubbleReturn = () => Animated.timing(bubbleStyleCoords, {toValue: {x: 0, y: 0}, duration: 200, useNativeDriver: true}).start();
      const BubbleDown = () => Animated.timing(bubbleStyleCoords, {toValue: {x: 0, y: dragCtx.bubbleHeight.current}, duration: 200, useNativeDriver: true}).start();

      let movement: MovementState = 'still';
      if (startIndex < itemIndex && currentIndex >= itemIndex && !(prevIndex >= itemIndex)) // It started above me, but is now at/below me, and it wasn't there before
        movement = 'avoiding_up';
      else if (startIndex > itemIndex && currentIndex <= itemIndex && !(prevIndex <= itemIndex)) // It started below me, but is now at/above me, and it wasn't there before
        movement = 'avoiding_down';
      else if (startIndex < itemIndex && currentIndex < itemIndex && !(prevIndex < itemIndex)) // It started above me, and is now above me, and it wasn't there before
        movement = 'returning';
      else if (startIndex > itemIndex && currentIndex > itemIndex && !(prevIndex > itemIndex)) // It started below me, and is now below me, and it wasn't there before
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
      if (itemIndex !== dragCtx.startIndex.current!) return;
  
      // Calculate the index the bubble should snap to
      const int_pos = Math.floor(value / (dragCtx.bubbleHeight.current));
      const rel_idx = int_pos + (int_pos < 0 ? 1 : 0);
      const idx = Math.max(0, Math.min(dragCtx.orderedIDs.current.length - 1, itemIndex + rel_idx));
  
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
  [itemIndex]);

  // Wait until the pan responder has been made, then rerender, to ensure that the Animated.View doesn't get passed a null
  if (!panResponderMade) {
    return <></>;
  }
  
  return (
    <>
    <Animated.View
      {...panResponderRef.current!.panHandlers}
      style={contentContainerStyles.concat([
        
        {
          transform: [{translateX: bubbleStyleCoords.x}, {translateY: bubbleStyleCoords.y}],
          backgroundColor: dragStyles ? colors.bubble_highlighted_grey : colors.bubble_grey,
          zIndex: dragStyles ? 1 : 0
        }
      ])}
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
          if (onDragStarted !== undefined)
            onDragStarted();
        }}
        style={{flex: 1}}
      >
        {/* Children go here */}
      </TouchableWithoutFeedback>
    </Animated.View>
    </>
  )
}