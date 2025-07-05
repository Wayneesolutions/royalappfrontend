import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Sign in</Text>

      <Text style={styles.title}>Let’s you sign in</Text>
      <Text style={styles.subtitle}>Welcome Back You Been Missed</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

    

      <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
        <Text style={styles.signInButtonText}>Sign in</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  forgotPassword: {
    color: '#077BC3',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 80,
    textAlign: 'right',
  },
  signInButton: {
    backgroundColor: '#077BC3',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    marginTop:40
  },
  signInButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  googleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  orText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#000000',
    fontWeight: '600',
  },
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookButtonText: {
    marginLeft: 8,
    color: '#077BC3',
    fontSize: 16,
    fontWeight: '700',
  },
});
