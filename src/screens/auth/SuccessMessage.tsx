import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import sucessicon from "../../../assets/success-icon.png"


type Props = NativeStackScreenProps<RootStackParamList, 'SuccessMessage'>;

const SuccessMessage: React.FC<Props> = ({ navigation }) => {


  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      <Image
        source={sucessicon} // use your green check icon
        className="w-20 h-20 mb-6"
        resizeMode="contain"
      />
      <Text className="text-black text-lg font-bold text-center">
        Password sent successfully.{"\n"}Your email address is verified.
      </Text>
      <Text
        className="text-blue-600 mt-4 text-sm"
        onPress={() => navigation.navigate('SignIn')}
      >
        Click here
      </Text>
      <Text className="text-black text-sm">to return to the login page</Text>
    </View>
  );
};

export default SuccessMessage;
