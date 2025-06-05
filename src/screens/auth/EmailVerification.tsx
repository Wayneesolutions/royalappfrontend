import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';



const EmailVerification = () => {
  const [code, setCode] = useState('');
 const navigation = useNavigation();


  const handleKeyPress = (digit: string) => {
    if (code.length < 6) setCode(code + digit);
  };

  const handleBackspace = () => {
    setCode(code.slice(0, -1));
  };

const handleVerify = () => {
  if (code === '123456') {
    navigation.navigate('SuccessMessage' as never);
  } else {
    navigation.navigate('ErrorMessage' as never);
  }
};


  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>Email Verification</Text>
        <Text style={styles.subtitle}>Please enter code sent to your email</Text>
        <Text style={styles.email}>yoursmail@gmail.com</Text>

        <View style={styles.codeContainer}>
          {[...Array(6)].map((_, index) => (
            <View key={index} style={styles.codeBox}>
              <Text style={styles.codeDigit}>
                {code[index] || ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Resend */}
        <Text style={styles.resend}>
          Having problem?{' '}
          <Text style={styles.resendLink} onPress={() => alert('Resent')}>
            Resend Code
          </Text>
        </Text>

        {/* Verify Button */}
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
        >
          <Text style={styles.verifyText}>Verify Code</Text>
        </TouchableOpacity>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {/* First Row */}
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((digit) => (
            <Pressable key={digit} style={styles.key} onPress={() => handleKeyPress(digit)}>
              <Text style={styles.keyText}>{digit}</Text>
            </Pressable>
          ))}
        </View>

        {/* Second Row */}
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((digit) => (
            <Pressable key={digit} style={styles.key} onPress={() => handleKeyPress(digit)}>
              <Text style={styles.keyText}>{digit}</Text>
            </Pressable>
          ))}
        </View>

        {/* Third Row */}
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((digit) => (
            <Pressable key={digit} style={styles.key} onPress={() => handleKeyPress(digit)}>
              <Text style={styles.keyText}>{digit}</Text>
            </Pressable>
          ))}
        </View>

        {/* Fourth Row: empty - 0 - backspace */}
        <View style={styles.keypadRow}>
          <View style={styles.key}>
            <Text style={styles.keyText}>{' '}</Text>
          </View>

          <Pressable style={styles.key} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyText}>0</Text>
          </Pressable>
          <Pressable style={styles.key} onPress={handleBackspace}>
            <Text style={styles.keyText}>⌫</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default EmailVerification;

// styles remain the same as your code (unchanged)
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  container: {
    padding: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'gray',
  },
  email: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 20,
  },
  codeBox: {
    borderBottomWidth: 2,
    borderColor: '#ccc',
    width: 30,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  codeDigit: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 4,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },

  resend: {
    color: 'gray',
    fontSize: 13,
    marginBottom: 20,
  },
  resendLink: {
    color: '#007bff',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    marginBottom: 30,
  },
  verifyText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  keypad: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: '#f2f2f2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 30,
    minHeight: 350,
  },

  key: {
    width: '30%',
    marginVertical: 10,
    alignItems: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
  },
});
