import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, } from 'react-native';
import { colors } from '../../variables';

import Title from '../../components/Title/Title';
import { DragAndDropScrollView } from '../../components/DragAndDrop/DragAndDrop';
import TaskBubble from './TaskBubble';
import Day from './TaskDay'

export default function Tasks({ route, navigation }: any) {
    const { routine_id, routine_name } = route.params;
    const [taskData, setTaskData] = useState<any>([]);
    const [tasks, setTasks] = useState<React.ReactNode[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [days, setDays] = useState<React.ReactNode[]>([]);
    const [activeDay, setActiveDay] = useState<number>(0); // 0 = today, 1 = yesterday, etc
 
    const moveItems = (startIndex: number, endIndex: number) => {
        if (startIndex === endIndex) return;

        const new_names = [...taskData];

        let reversed = false;
        if (startIndex > endIndex) {
            reversed = true;
            new_names.reverse();
            startIndex = new_names.length - 1 - startIndex;
            endIndex = new_names.length - 1 - endIndex;
        }

        const [removed] = new_names.splice(startIndex, 1);
        new_names.splice(endIndex, 0, removed);

        if (reversed) {
            new_names.reverse();
        }

        setTaskData(new_names);
    }

    useEffect(() => {
        const the_names: any[] = [];
        for (let i = 0; i < 20; i++) {
            the_names.push({name:'Task ' + i.toString(), id: i});
        }
        setTaskData(the_names);
    }, [])

    useEffect(() => {
        setTimeout(() => {
            const the_tasks: React.ReactNode[] = [];

            for (let i = 0; i < taskData.length; i++) {
                the_tasks.push(
                    <TaskBubble taskName={taskData[i].name} index={i} onDragFinished={moveItems} key={taskData[i].id}/>
                )
            }
            setTasks(the_tasks);

            const the_days = []
            for (let i = 0; i < 7; i++) {
                the_days.push(
                    <Day days_back={i} active={activeDay === i} key={i}/>
                );
            }
            setDays(the_days);

            setLoading(false);
        }, 0);
    }, [taskData]);

    if (loading) {
        return <></>
    }

    return (
        <View style={{flex: 1, backgroundColor: colors.background_grey}}>
            <Title title={routine_name} onPressAdd={() => {}} buttons={[]}></Title>
            <View style={styles.days_container}>
                <View style={styles.days}>
                    {days}
                </View>
            </View>
            <DragAndDropScrollView
                contentContainerStyle={styles.task_bubbles}

                itemGap={5}
                scrollEnabled={false}
            >
                {tasks}
            </DragAndDropScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    task_bubbles: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 5,
        gap: 5,
    },

    days_container: {
        width: '100%',
        paddingTop: 5, 
        paddingLeft: 27,
        paddingRight: 20,
        marginBottom: 5,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    days: {
        width: '64%',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    day: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    day_text: {
        fontFamily: 'notoSansRegular',
        fontSize: 12,
        color: colors.grey,
        fontWeight: 'bold',
    },
});