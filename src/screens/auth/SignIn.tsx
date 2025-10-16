import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome, AntDesign } from "@expo/vector-icons";
import { RootStackParamList } from "../../navigation/types";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const SignIn: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert username to email format for consistency with your auth system
      const email = username.includes('@') ? username : `${username}@company.com`;
      await login(email.trim().toLowerCase(), password);
      // Navigation will be handled automatically by AppNavigator based on user role
    } catch (error) {
      Alert.alert(
        'Login Failed', 
        error instanceof Error ? error.message : 'Invalid credentials'
      );
    } finally {
      setIsLoading(false);
    }
  };

// Demo credentials for testing different roles (tap to fill)
  const demoCredentials = [
    { role: 'SuperAdmin', username: 'superadmin', password: '123456' },
    { role: 'Admin', username: 'admin', password: '123456' },
    { role: 'RSM', username: 'rsm', password: '123456' },
    { role: 'ASM', username: 'asm', password: '123456' },
    { role: 'Distributor', username: 'distributor', password: '123456' },
    { role: 'Dealer', username: 'dealer', password: '123456' },
    { role: 'Sub Dealer', username: 'subdealer', password: '123456' },
    { role: 'Salesman', username: 'salesman', password: '123456' },
  ];

  const fillDemoCredentials = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Sign in</Text>

        <Text style={styles.title}>Let's you sign in</Text>
        <Text style={styles.subtitle}>Welcome Back You Been Missed</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.signInButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.signInButtonText}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Text>
        </TouchableOpacity>

        {/* Demo Credentials Section */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Credentials (Tap to fill):</Text>
          <View style={styles.demoGrid}>
            {demoCredentials.map((demo, index) => (
              <TouchableOpacity
                key={index}
                style={styles.demoButton}
                onPress={() => fillDemoCredentials(demo.username, demo.password)}
              >
                <Text style={styles.demoButtonText}>{demo.role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop: 40
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
  // Demo credentials styles
  demoSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  demoButton: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  demoButtonText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
});