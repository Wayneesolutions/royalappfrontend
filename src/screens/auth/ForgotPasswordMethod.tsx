import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPasswordMethod'>;

const ForgotPasswordMethod: React.FC<Props> = ({ navigation }) => {
  return (
    <View className="flex-1 bg-white px-6 py-20">
      <Text className="text-xl font-bold mt-10">Forgot Password</Text>
      <Text className="text-sm text-gray-400 mb-8">
        Please select option to send link{"\n"}reset password
      </Text>

      {/* Reset via Email */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PasswordRecoveryEmail')}
        className="bg-white rounded-xl p-4 mb-8 mt-15 border border-gray-200 shadow-sm flex-row items-center"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3 }}
      >
        <View className="mr-3">
          <MaterialCommunityIcons name="email-fast-outline" size={30} color="#000" />
        </View>
        <View>
          <Text className="text-base font-bold text-black">Reset Via Email</Text>
          <Text className="text-xs text-gray-400">If you have email linked to account</Text>
        </View>
      </TouchableOpacity>

      {/* Reset via SMS */}
      <TouchableOpacity
        onPress={() => alert('SMS option not implemented')}
        className="bg-white rounded-xl p-4 flex-row items-center border border-gray-200"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3 }}
      >
        <View className="relative mr-3">
          <MaterialIcons name="sms" size={30} color="#000" />
          <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
        </View>
        <View>
          <Text className="text-base font-bold text-black">Reset Via SMS</Text>
          <Text className="text-xs text-gray-400">If you have phone linked to account</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordMethod;
