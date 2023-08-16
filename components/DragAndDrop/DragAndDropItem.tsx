import { useState, useRef, useEffect } from 'react';
import { PanResponder, PanResponderInstance, Animated } from 'react-native';
import { useDragAndDrop } from './DragAndDropContext';

type DragAndDropItemProps = {
  itemIndex: number,
  startDragRef: React.MutableRefObject<() => void>,
  onDragStarted?: (startIndex: number) => void,
  onDragFinishing?: (startIndex: number, endIndex: number) => void,
  onDragFinished: (startIndex: number, endIndex: number) => void,

  contentContainerStyle?: any,
  contentContainerStyleSelected?: any,
  children?: React.ReactNode,
}

export default function DragAndDropItem({itemIndex, startDragRef, onDragStarted, onDragFinishing, onDragFinished, contentContainerStyle, contentContainerStyleSelected, children}: DragAndDropItemProps) {
  // Drag and drop stuff
  const dragCtx = useDragAndDrop();
  const trackingTouch = useRef<boolean>(false);
  const [dragStylesEnabled, setDragStylesEnabled] = useState<boolean>(false);
  const setDragging = (value: boolean) => { dragCtx.setScrollEnabled(!value); setDragStylesEnabled(value); trackingTouch.current = value; }
  // Bubble Offset
  const touchScreenPos = useRef({x: 0, y: 0});
  const bubbleStylePos = useRef(new Animated.ValueXY()).current;
  const draggingAnimationFrame = useRef<number|null>(0);
  const panResponderRef = useRef<PanResponderInstance|null>(null);

  // Function should be called by user to indicate that this touch is for dragging the bubble
  startDragRef.current = () => setDragging(true);

  // Updates the style coordinates of the bubble while it's being dragged, based on the screen pos of the touch and the current y value of the scrollview
  // Animation is started below when this bubble is picked up, and stopped when the bubble is released.
  const updateStyleCoords = () => {
    const styleCoords = {
      x: touchScreenPos.current.x,
      y: touchScreenPos.current.y + (dragCtx.scrollDepth.current - dragCtx.touchHeightStart.current)
    };
    Animated.event([{
      x: bubbleStylePos.x,
      y: bubbleStylePos.y,
    }], {useNativeDriver: false}, )(styleCoords);
    draggingAnimationFrame.current = requestAnimationFrame(updateStyleCoords);
  }

  // Makes a new panResponder. This needs to happen at the start, and also when the item index changes, so having a function is useful
  const remakePanResponder = () => PanResponder.create({
    onStartShouldSetPanResponder: () => trackingTouch.current,
    onMoveShouldSetPanResponder: () => trackingTouch.current,

    onPanResponderGrant: () => {
      dragCtx.startIndex.current = itemIndex;
      dragCtx.prevIndex.current = itemIndex;
      dragCtx.currentIndex.current = itemIndex;
      dragCtx.touchHeightStart.current = dragCtx.scrollDepth.current;
      draggingAnimationFrame.current = requestAnimationFrame(updateStyleCoords);
      if (onDragStarted !== undefined)
        onDragStarted(itemIndex);
    },

    onPanResponderMove: (e, gestureState) => {
      // dragCtx is responsible for determining if the scrollView should be scrolled up/down depending on screen coordinates of touch
      dragCtx.updateEdgeDivingVelocity(gestureState.dy + gestureState.y0);
      // Save screen coordinates of touch
      touchScreenPos.current = {x: gestureState.dx, y: gestureState.dy};
    },

    onPanResponderEnd: () => {
      setDragging(false);
      dragCtx.updateEdgeDivingVelocity(null);
      cancelAnimationFrame(draggingAnimationFrame.current!);

      onDragFinishing?.(dragCtx.startIndex.current!, dragCtx.currentIndex.current!);

      // When letting go, make bubble snap to the index it is closest to
      // DB gets updated once this animation finishes, since by then all animations should be done.
      Animated.timing(
        bubbleStylePos,
        {toValue: {x: 0, y: dragCtx.draggedItemHeight.current * (dragCtx.currentIndex.current! - itemIndex)}, duration: dragCtx.droppingAnimationDuration, useNativeDriver: true}
      ).start(() => {
        onDragFinished(dragCtx.startIndex.current!, dragCtx.currentIndex.current!);
      });
    },
  });

  if (panResponderRef.current === null)
    panResponderRef.current = remakePanResponder();


  // All of this stuff is in some way based on the itemIndex, so we need to update it when the itemIndex changes
  useEffect(() => {
    // If the itemIndex changed, then our previous coords are no longer valid
    touchScreenPos.current = {x: 0, y: 0};
    bubbleStylePos.setValue({x: 0, y: 0});

    // The panResponder will continue to use the old itemIndex even after the rerender since it's stored in a reference, so we need to update it
    panResponderRef.current = remakePanResponder();
    
    // The drag evasion logic is based on the itemIndex, so the listener needs to be updated
    const evasionListenerdId = dragCtx.indexBroadcast.addListener((startIndex: number, prevIndex: number, currentIndex: number) => {
      if (startIndex === itemIndex) { // This bubble is being dragged, so no need to evade
        return;
      }

      type MovementState = 'still' | 'avoiding_up' | 'avoiding_down' | 'returning';

      const BubbleUp = () => Animated.timing(bubbleStylePos, {toValue: {x: 0, y: -dragCtx.draggedItemHeight.current}, duration: dragCtx.evasionAnimationDuration, useNativeDriver: true}).start();
      const BubbleReturn = () => Animated.timing(bubbleStylePos, {toValue: {x: 0, y: 0}, duration: dragCtx.evasionAnimationDuration, useNativeDriver: true}).start();
      const BubbleDown = () => Animated.timing(bubbleStylePos, {toValue: {x: 0, y: dragCtx.draggedItemHeight.current}, duration: dragCtx.evasionAnimationDuration, useNativeDriver: true}).start();

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

    // Similarly, the listener for the index broadcaster will be out of date 
    const indexBroadcasterListenerId = bubbleStylePos.y.addListener(({value}) => {
      // If this is the dragged bubble, the listener reads the value of the bubble offset, calculates the index it should snap to, and updates the indices in the dragCtx
      // Values will only be updated if the bubble is actaully being dragged

      // No bubble is being dragged, so no need to update indices
      if (!trackingTouch.current) return;
      // I'm not the one being dragged, so I don't do the updating
      if (itemIndex !== dragCtx.startIndex.current!) return;
  
      // Calculate the index the bubble should snap to
      const int_pos = Math.floor(value / (dragCtx.draggedItemHeight.current));
      const rel_idx = int_pos + (int_pos < 0 ? 1 : 0);
      const idx = Math.max(0, Math.min(dragCtx.numItems.current - 1, itemIndex + rel_idx));
  
      // Update the indices in the dragCtx if they have changed
      if (idx !== dragCtx.currentIndex.current) {
        dragCtx.prevIndex.current = dragCtx.currentIndex.current;
        dragCtx.currentIndex.current = idx;
        // Notify the other bubbles that the indices have changed, so they can update their offsets
        dragCtx.indexBroadcast.notifyListeners();
      }
    });

    // The listeners need to be removed the next time this effect runs
    return () => {
      dragCtx.indexBroadcast.removeListener(evasionListenerdId);
      bubbleStylePos.y.removeListener(indexBroadcasterListenerId);
    };
  },
  [itemIndex]);
  
  return (
    <>
    <Animated.View
      {...panResponderRef.current!.panHandlers}
      style={[
        contentContainerStyle,
        dragStylesEnabled ? contentContainerStyleSelected : {},
        {
          transform: [{translateX: bubbleStylePos.x}, {translateY: bubbleStylePos.y}],
        },
      ]}
      onLayout={(event) => dragCtx.draggedItemHeight.current = event.nativeEvent.layout.height + dragCtx.itemGap}
    >
      {children}
    </Animated.View>
    </>
  )
}