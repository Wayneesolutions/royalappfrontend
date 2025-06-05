import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import errorIcon from '../../../assets/error-icon.png';


type Props = NativeStackScreenProps<RootStackParamList, 'ErrorMessage'>;

const ErrorMessage: React.FC<Props> = ({ navigation }) => {


  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      <Image
        source={errorIcon} // use your warning icon
        className="w-20 h-20 mb-6"
        resizeMode="contain"
      />
      <Text className="text-red-600 text-lg font-bold text-center">
        Failed to send password.
      </Text>
      <Text className="text-black text-lg font-bold text-center">
        Please check your email address{"\n"}and try again
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

export default ErrorMessage;
