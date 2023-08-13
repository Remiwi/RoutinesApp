import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Animated, PanResponder, InteractionManager } from 'react-native';
import { colors } from '../../variables';

import Title from '../../components/Title/Title';

const CIRCLE_EMPTY = require('../../assets/icons/circle_empty.png');
const CIRCLE_HALF = require('../../assets/icons/circle_half.png');
const CIRCLE_FULL = require('../../assets/icons/circle_full.png');

export default function Tasks({ route, navigation }: any) {
    const { routine_id, routine_name } = route.params;
    const [tasks, setTasks] = useState<React.ReactNode[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [days, setDays] = useState<React.ReactNode[]>([]);
    const [activeDay, setActiveDay] = useState<number>(0); // 0 = today, 1 = yesterday, etc
    const scrollEnabled = useRef(true);

    useEffect(() => {
        setTimeout(() => {
            const the_tasks: React.ReactNode[] = [];
            for (let i = 0; i < 20; i++) {
                the_tasks.push(
                    <Task task_name={'Task ' + i.toString()} scrollRef={scrollEnabled} key={i}/>
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
    }, []);

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
            <ScrollView contentContainerStyle={styles.task_bubbles} scrollEnabled={scrollEnabled.current}>
                {tasks}
            </ScrollView>
        </View>
    )
}

type TaskProps = {
    task_name: string,
    scrollRef: React.MutableRefObject<boolean>,
}

function Task({task_name, scrollRef}: TaskProps) {
    const pan: Animated.ValueXY = useRef(new Animated.ValueXY({x: 0, y: 0})).current;

    const panResponder = useRef(PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 50;
            },
            onPanResponderGrant: () => { scrollRef.current = false; },
            onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {useNativeDriver: false}),
            onPanResponderEnd: () => {
                Animated.spring(pan, {toValue: {x: 0, y: 0}, useNativeDriver: true}).start();
                scrollRef.current = true;
            }
        })
    ).current;

    return (
        <Animated.View style={{transform: [{translateX: pan.x}]}} {...panResponder.panHandlers}>
            <View style={styles.task}>
                <Text style={styles.task_name}>{task_name}</Text>
                <View style={styles.entries}>
                    <Entry entry={'full'}/>
                    <Entry entry={'half'}/>
                    <Entry entry={'empty'}/>
                    <Entry entry={'empty'}/>
                    <Entry entry={'empty'}/>
                    <Entry entry={'empty'}/>
                    <Entry entry={'empty'}/>
                </View>
            </View>
        </Animated.View>
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

type DayProps = {
    days_back: number,
    active: boolean
}

function Day({days_back, active}: DayProps) {
    const day = new Date();
    day.setDate(day.getDate() - days_back);

    const dayofweek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][day.getDay()];
    const dayofmonth = day.getDate();

    return (
        <View style={styles.day}>
            <Text style={[styles.day_text, {color: active ? colors.white : colors.grey}]}>{dayofweek}</Text>
            <Text style={[styles.day_text, {color: active ? colors.white : colors.grey}]}>{dayofmonth}</Text>
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

    task: {
        width: '100%',
        height: 50,
        backgroundColor: colors.bubble_grey,
        borderRadius: 500000,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 22,
    },
    task_name: {
        fontFamily: 'notoSansRegular',
        fontSize: 12,
        color: colors.white,
        bottom: 1,
        width: '34%'
    },
    entries: {
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



    days_container: {
        width: '100%',
        paddingTop: 5, 
        paddingLeft: 27,
        paddingRight: 20,
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