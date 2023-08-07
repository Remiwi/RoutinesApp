import { Text, View } from 'react-native';
import { colors } from '../../variables';

export default function Dummy() {
    return (
        <View style={{flex: 1, backgroundColor: colors.background_grey, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{color: colors.white, fontFamily:'notoSansRegular'}}>Dummy Screen</Text>
        </View>
    )
}