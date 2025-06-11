import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { FontAwesome, AntDesign } from "@expo/vector-icons";
import { RootStackParamList } from "../../navigation/types";
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const SignIn: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const users = [
      { username: 'admin', password: '123456', route: 'DashboardAdmin' },
      { username: 'rsm', password: '123456', route: 'DashboardRSM' },
      { username: 'asm', password: '123456', route: 'DashboardASM' },
      { username: 'distributor', password: '123456', route: 'DashboardDistributor' },
      { username: 'dealer', password: '123456', route: 'DashboardDealer' },
      { username: 'subdealer', password: '123456', route: 'DashboardSubDealer' },
      { username: 'salesman', password: '123456', route: 'DashboardSalesman' },
    ];

    const user = users.find(
      (u) => u.username === username.toLowerCase() && u.password === password
    );

    if (user) {
      navigation.navigate(user.route as any);
    } else {
      alert('Invalid credentials');
    }
  };


  return (
    <ScrollView className="flex-1 bg-white px-6 py-12">
      <Text className="text-xl font-semibold text-center mt-8 mb-14">Sign in</Text>

      <Text className="text-2xl font-bold text-black mb-1">Let’s you sign in</Text>
      <Text className="text-sm text-gray-400 mb-8">Welcome Back You Been Missed</Text>

      <Text className="text-sm font-semibold mb-1">Username</Text>
      <TextInput
        className="border border-black-300 rounded-lg px-4 py-4 mb-4"
        value={username}
        onChangeText={setUsername}
      />

      <Text className="text-sm font-semibold mb-1">Password</Text>
      <TextInput
        secureTextEntry
        className="border border-black-300 rounded-lg px-4 py-4 mb-2"
        value={password}
        onChangeText={setPassword}
      />

      <Text
        className="text-blue-700 text-xs font-semibold mb-20 text-right"
        onPress={() => navigation.navigate("ForgotPasswordMethod")}
      >
        Forget Password
      </Text>

      <TouchableOpacity
        onPress={handleLogin}
        className="bg-[#077BC3] rounded-lg py-3 mb-4"
      >
        <Text className="text-white text-center font-bold text-base">Sign in</Text>
      </TouchableOpacity>

      <TouchableOpacity className="flex-row items-center justify-center border border-black rounded-lg py-3 mb-4">
        <AntDesign name="google" size={20} color="black" />
        <Text className="ml-2 text-base font-medium text-black">
          Sign in with google
        </Text>
      </TouchableOpacity>

      <Text className="text-center mb-2 text-black font-semibold">or</Text>

      <TouchableOpacity className="flex-row items-center justify-center">
        <FontAwesome name="facebook-official" size={22} color="#077BC3" />
        <Text className="ml-2 text-[#077BC3] text-base font-bold">Facebook</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SignIn;
