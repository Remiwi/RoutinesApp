import { useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableNativeFeedback, Modal, Keyboard } from 'react-native';
import { colors } from '../../variables';

type TextInputModalProps = {
    visible: boolean,
    msg: string
    errorMsg?: string,
    handleCancel: () => void,
    handleConfirm: (text: string) => void,
}

export default function TextInputModal({visible, msg, errorMsg, handleCancel, handleConfirm}: TextInputModalProps) {
    const [text, setText] = useState<string>('');
    const textInput = useRef<TextInput>(null);
    
    useEffect(() => {
        if (visible) {
            setTimeout(() => {
                textInput.current?.focus();
            }, 100);
        }
    }, [visible]);

    const handleOKButton = () => {
        handleConfirm(text);
        setText('');
    }

    const handleCancelButton = () => {
        handleCancel();
        setText('');
    }

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={handleCancelButton}
            animationType='fade'
        >
            <View style={styles.background}>
                <View style={styles.container}>
                    <View style={{width: '100%'}}>
                        <Text style={styles.text}>{msg}</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.inputText}
                                cursorColor={colors.blue}
                                onChangeText={setText}
                                ref={textInput}
                            />
                        </View>
                    </View>
                    { errorMsg !== '' && errorMsg !== undefined &&
                        <View>
                            <Text style={styles.error_text}>{errorMsg}</Text>
                        </View>
                    }
                    <View style={{width: '100%', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15}}>
                        <View style={{overflow:'hidden', borderRadius: 500000}}>
                            <TouchableNativeFeedback onPress={handleCancelButton}>
                                <View style={{borderRadius: 500000}}>
                                    <Text style={styles.button}>Cancel</Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                        <View style={{overflow:'hidden', borderRadius: 500000}}>
                            <TouchableNativeFeedback onPress={handleOKButton}>
                                <View style={{borderRadius: 500000}}>
                                    <Text style={styles.button}>OK</Text>
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
        fontSize: 14,
        color:colors.blue,
        marginLeft: 10,
        marginBottom: 2,
        fontFamily: 'notoSansRegular',
    },
    inputContainer: {
        width: '100%',
        backgroundColor:colors.nav_grey,
        borderWidth: 1,
        borderRadius: 4,
        borderColor: colors.blue,
        padding: 4,
        paddingLeft: 10,
        paddingRight: 10
    },
    inputText: {
        color: colors.white,
        fontFamily: 'notoSansRegular',
    },
    error_text: {
        marginTop: 4,
        fontSize: 11,
        color: colors.error_red,
        fontFamily: 'notoSansRegular',
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