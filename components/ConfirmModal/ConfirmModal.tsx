import { StyleSheet, Text, View, TouchableNativeFeedback, Modal } from 'react-native';
import { colors } from '../../variables';

type ConfirmModalProps = {
    visible: boolean,
    msg: string,
    handleCancel: () => void,
    handleConfirm: () => void,
    cancelColor?: string,
    confirmColor?: string,
}

export default function TextInputModal({visible, msg, handleCancel, handleConfirm, cancelColor, confirmColor}: ConfirmModalProps) {
    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={handleCancel}
            animationType='fade'
        >
            <View style={styles.background}>
                <View style={styles.container}>
                    <Text style={styles.text}>{msg}</Text>
                    <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 15}}>
                        <View style={{overflow:'hidden', borderRadius: 500000}}>
                            <TouchableNativeFeedback onPress={handleCancel}>
                                <View style={styles.buttonContainer}>
                                    <Text style={[styles.button, cancelColor !== undefined ? {color: cancelColor} : {}]}>Cancel</Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                        <View style={{overflow:'hidden', borderRadius: 500000}}>
                            <TouchableNativeFeedback onPress={handleConfirm}>
                                <View style={styles.buttonContainer}>
                                    <Text style={[styles.button, confirmColor !== undefined ? {color: confirmColor} : {}]}>Confirm</Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.transparent_grey
    },
    container: {
        backgroundColor: colors.nav_grey,
        width: 280,
        borderRadius:26,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8
    },
    text: {
        fontSize: 16,
        color:colors.white,
        marginLeft: 10,
        marginBottom: 2,
        textAlign: 'center',
        fontFamily: 'notoSansRegular',
    },
    buttonContainer: {
        borderRadius: 500000,
        justifyContent:'center',
        alignItems:'center',
        width: 110,
    },
    button: {
        fontSize: 14,
        color:colors.blue,
        padding: 10,
        paddingLeft: 20,
        paddingRight: 20,
        fontFamily: 'notoSansRegular',
    }
});