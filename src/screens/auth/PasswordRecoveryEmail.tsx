import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PasswordRecoveryEmail'>;

const PasswordRecoveryEmail: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleSend = () => {
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Here you can call your API to send the verification code
    // Then navigate:
    navigation.navigate('EmailVerification', { email });
  };

  return (
    <View className="flex-1 bg-white px-6 py-20">
      <Text className="text-xl font-bold mt-10">Password Recovery</Text>
      <Text className="text-sm text-gray-400 mb-8">
        We have sent a password recovery code{'\n'}to the email address below
      </Text>

      <Text className="text-sm font-semibold mb-1">Email Address</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@example.com"
        className="border border-gray-300 rounded-lg px-4 py-4 mb-4"
      />

      <TouchableOpacity
        onPress={handleSend}
        className="bg-blue-600 py-4 rounded-lg mt-2"
      >
        <Text className="text-white text-center font-semibold text-base">
          Send
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PasswordRecoveryEmail;
