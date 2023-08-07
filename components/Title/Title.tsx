import { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableNativeFeedback } from 'react-native';
import { colors } from '../../variables';

import MenuModal, { MenuModalButtonProps } from '../MenuModal/MenuModal';

type TitleProps = {
    title: string;
    onPressAdd: () => void;
    buttons: MenuModalButtonProps[];
}

export default function Title({title, onPressAdd, buttons}: TitleProps) {
    const [menuVisible, setMenuVisible] = useState<boolean>(false);

    return (
        <>
        <MenuModal
            visible={menuVisible}
            handleCancel={() => {setMenuVisible(false)}}
            buttons={buttons.map((button) => {
                return {
                    label: button.label,
                    onPress: () => {
                        button.onPress();
                        setTimeout(() => {
                            setMenuVisible(false);
                        }, 100);
                    }
                }
            })}
        />

        <View style={{padding: 15, flexDirection: 'row', paddingBottom: 0}}>
            <Text style={styles.page_title}>{title}</Text>
            <View style={{flexDirection: 'row', gap: 10, padding: 10, paddingRight: 0}}>
                <View style={{borderRadius:500000, overflow:'hidden'}}>
                    <TouchableNativeFeedback onPress={onPressAdd}>
                        <View>
                            <Image source={require("../../assets/icons/add.png")} style={styles.top_image}/>
                        </View>
                    </TouchableNativeFeedback>
                </View>
                <View style={{borderRadius:500000, overflow:'hidden'}}>
                    <TouchableNativeFeedback onPress={() => {setMenuVisible(true)}}>
                        <View>
                            <Image source={require("../../assets/icons/more_vert.png")} style={styles.top_image}/>
                        </View>
                    </TouchableNativeFeedback>
                </View>
            </View>
        </View>
        </>
    )
}

const styles = StyleSheet.create({
    page_title: {
        color: colors.white,
        fontSize: 25,
        flex: 1,
        alignItems: 'center',
        fontFamily: 'notoSansRegular',
    },
    top_image: {
        tintColor: colors.white,
        width: 30,
        height: 30,
    },
});