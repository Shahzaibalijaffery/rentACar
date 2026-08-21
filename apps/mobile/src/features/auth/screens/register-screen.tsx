import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
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
  const [phone, setPhone] = useState('');

  const handleRegister = () => {
    registerMutation.mutate(
      { email, password, fullName, cnic, phone },
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
    <ScreenLayout>
      <View style={styles.header}>
        <AppText variant="title">Create your account</AppText>
        <AppText variant="body" style={styles.subtitle}>
          One account works for both renting and listing vehicles.
        </AppText>
      </View>

      <AppCard>
        <FormField
          label="Full name"
          placeholder="Your full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
        <FormField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="CNIC"
          placeholder="35201-1234567-1"
          keyboardType="number-pad"
          value={cnic}
          onChangeText={setCnic}
          hint="Used to verify identity during rentals."
        />
        <FormField
          label="Phone"
          placeholder="03001234567"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          hint="Shared with the other party only after a request is accepted."
        />
        <FormField
          label="Password"
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
        />

        <AppButton
          title="Create account"
          loading={registerMutation.isPending}
          onPress={handleRegister}
        />
      </AppCard>

      <AppButton
        title="Already have an account? Sign in"
        variant="ghost"
        onPress={() => navigation.navigate('Login')}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
  },
});
