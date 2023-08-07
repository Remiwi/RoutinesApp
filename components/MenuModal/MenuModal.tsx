import { StyleSheet, Text, View, TouchableNativeFeedback, Modal, Pressable } from 'react-native';
import { colors } from '../../variables';

export type MenuModalButtonProps = {
    label: string,
    onPress: () => void    
}

type MenuModalProps = {
    visible: boolean,
    handleCancel: () => void,
    buttons: MenuModalButtonProps[]
}

export default function MenuModal({visible, handleCancel, buttons}: MenuModalProps) {
    return (
    <Modal
        transparent
        visible={visible}
        onRequestClose={handleCancel}
        animationType='fade'
    >
        <Pressable style={styles.background} onPress={handleCancel}>
            <View style={styles.container}>
                <View style={styles.betweenButtons}>
                    {
                        buttons.map((button, index) => {
                            return (
                                <MenuModalButton
                                    key={index}
                                    label={button.label}
                                    onPress={button.onPress}
                                />
                            )
                        })
                    }
                </View>
            </View>
        </Pressable>
    </Modal>
    )
}

function MenuModalButton({label, onPress}: MenuModalButtonProps) {
    return (
        <TouchableNativeFeedback onPress={onPress}>
            <View style={styles.button}>
                <Text style={styles.buttonLabel}>{label}</Text>
            </View>
        </TouchableNativeFeedback>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    container: {
        top: 60,
        right: 15,
        backgroundColor: colors.white,
        padding: 5,
        borderRadius: 5,
        gap: 8,
    },
    betweenButtons: {
        minWidth: 180,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    button: {
        backgroundColor: colors.white,
        width: '100%',
        padding: 5,
        paddingLeft: 10,
        paddingRight: 10,
    },
    buttonLabel: {
        fontFamily: 'notoSansRegular',
        fontSize: 16,
        color: colors.background_grey,
    },
});