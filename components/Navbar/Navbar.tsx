import React from 'react';
import { StyleSheet, Text, View, Image, TouchableNativeFeedback } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../../variables';

export default function Navbar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                return (
                    <NavbarButton
                        key={route.key}
                        imageFunction={options.tabBarIcon}
                        text={route.name}
                        selected={isFocused}
                        onPress={() => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            })

                            if (!event.defaultPrevented && !isFocused) {
                                navigation.navigate({ name: route.name, merge: true, params: undefined });
                            }
                        }}
                    />
                )
                })
            }
        </View>
    )
}


function NavbarButton({ imageFunction, text, selected, onPress }: any) {
    return (
        <View style={styles.nav_button}>
            <View style={[styles.pill, {overflow:'hidden'}]}>
                <TouchableNativeFeedback onPress={onPress}>
                    <View style={[styles.pill, {backgroundColor: selected ? colors.dark_blue : colors.nav_grey}]}>
                        {imageFunction(selected)}
                    </View>
                </TouchableNativeFeedback>
            </View>
            <Text style={[styles.text, {color: selected ? colors.white : colors.dim_grey}]}>{text}</Text>
        </View>
    )
}

export function NavbarButtonImageFactory(source: any) {
    const NavbarButtonImage = ({ focused }: any) => (
        <Image
            source={source}
            style={[styles.icon, {tintColor: focused ? colors.light_blue : colors.dim_grey}]}
        />
    )

    return NavbarButtonImage;
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
        paddingBottom: 8,
        width: '100%',
        backgroundColor: colors.nav_grey,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-evenly',
    },
    nav_button: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',

    },
    pill: {
        width: 70,
        height: 30,
        borderRadius: 500000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        width: 23,
        height: 23 ,
    },
    text: {
        color: colors.white,
        fontFamily: 'notoSansRegular',
        fontSize: 13,
    },
})