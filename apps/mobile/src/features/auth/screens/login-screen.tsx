import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useLoginMutation } from '@/api/hooks/use-auth';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    loginMutation.mutate(
      { email, password },
      {
        onError: (error) => {
          Alert.alert('Sign in failed', error.message);
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <AppText variant="title">Sign in</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        Use your verified RentACar account.
      </AppText>

      <AppInput
        placeholder="Email"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <AppInput
        placeholder="Password"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      <AppButton title="Sign in" loading={loginMutation.isPending} onPress={handleLogin} />

      {/* Email verification disabled for now
      <AppButton
        title="Need to verify email?"
        variant="secondary"
        onPress={() => navigation.navigate('VerifyEmail', { email })}
      />
      */}

      <AppButton
        title="Create an account"
        variant="secondary"
        onPress={() => navigation.navigate('Register')}
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
