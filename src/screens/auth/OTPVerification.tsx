import React, { useState, useEffect } from "react";
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
import { RootStackParamList } from "../../navigation/types";
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'OTPVerification'>;

const OTPVerification: React.FC<Props> = ({ navigation, route }) => {
  const { emailOrPhone } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const STATIC_OTP = '123456';

  useEffect(() => {
    // Start countdown timer for resend OTP
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOTP = () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.trim() !== STATIC_OTP) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to reset password screen
      navigation.navigate('ResetPassword', { emailOrPhone });
    }, 500);
  };

  const handleResendOTP = () => {
    if (!canResend) return;

    setResendTimer(60);
    setCanResend(false);
    setOtp('');
    Alert.alert('Success', 'OTP has been resent. Use 123456 to verify.');
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Verify OTP</Text>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a verification code to{'\n'}
          <Text style={styles.emailOrPhone}>{emailOrPhone}</Text>
        </Text>

        <Text style={styles.label}>Enter OTP</Text>
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter 6-digit OTP"
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.hintText}>
          For testing: Use <Text style={styles.otpHint}>123456</Text>
        </Text>

        <TouchableOpacity 
          style={[styles.verifyButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleVerifyOTP}
          disabled={isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendButton}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend in {resendTimer}s
            </Text>
          )}
        </View>

        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OTPVerification;

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
    lineHeight: 20,
  },
  emailOrPhone: {
    fontWeight: '600',
    color: '#077BC3',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  otpHint: {
    fontWeight: '700',
    color: '#077BC3',
  },
  verifyButton: {
    backgroundColor: '#077BC3',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  resendButton: {
    fontSize: 14,
    color: '#077BC3',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#077BC3',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});

