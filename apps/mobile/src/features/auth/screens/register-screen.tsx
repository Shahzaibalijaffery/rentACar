import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useRegisterMutation } from '@/api/hooks/use-auth';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const registerMutation = useRegisterMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');

  const handleRegister = () => {
    registerMutation.mutate(
      { email, password, fullName, cnic },
      {
        onSuccess: () => {
          Alert.alert('Account created', 'You can sign in now.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') },
          ]);
        },
        onError: (error) => {
          Alert.alert('Registration failed', error.message);
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <AppText variant="title">Create account</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        Register with your CNIC to use RentACar as an owner or renter.
      </AppText>

      <AppInput placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <AppInput
        placeholder="Email"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <AppInput
        placeholder="CNIC (13 digits)"
        keyboardType="number-pad"
        value={cnic}
        onChangeText={setCnic}
      />
      <AppInput
        placeholder="Password"
        secureTextEntry
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
      />

      <AppButton title="Register" loading={registerMutation.isPending} onPress={handleRegister} />

      <AppButton
        title="Already have an account? Sign in"
        variant="secondary"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
