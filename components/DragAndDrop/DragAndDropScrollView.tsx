import React, { useRef } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useDragAndDrop } from '../../components/DragAndDrop/DragAndDropContext';

export default function DragAndDropScrollView(props: ScrollViewProps) {
  // Drag and Drop
  const dragCtx = useDragAndDrop();
  const scrollViewDepth = useRef<number>(0);

  dragCtx.numItems.current = React.Children.count(props.children);

  return (
    <ScrollView
      {...props}
      ref={dragCtx.scrollRef}
      scrollEnabled={dragCtx.scrollEnabled}
      onScroll={e => {
        if (dragCtx.scrollEnabled) // When scroll is disbled, the updating of this value should be left to the drag and drop
        dragCtx.scrollDepth.current = e.nativeEvent.contentOffset.y;
      }}
      onLayout={e => {
        dragCtx.scrollViewHeight.current = e.nativeEvent.layout.height;

        dragCtx.maxScrollDepth.current = scrollViewDepth.current - dragCtx.scrollViewHeight.current;
      }}
      onContentSizeChange={(_, h) => {
        scrollViewDepth.current = h;

        dragCtx.maxScrollDepth.current = scrollViewDepth.current - dragCtx.scrollViewHeight.current;
      }}
    >
      {props.children}
    </ScrollView>
  )
}