import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useResendVerificationMutation, useVerifyEmailMutation } from '@/api/hooks/use-auth';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();
  const [token, setToken] = useState('');
  const email = route.params?.email ?? '';

  const handleVerify = () => {
    verifyMutation.mutate(token.trim(), {
      onSuccess: () => {
        Alert.alert('Email verified', 'You can now sign in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      },
      onError: (error) => {
        Alert.alert('Verification failed', error.message);
      },
    });
  };

  const handleResend = () => {
    if (!email) {
      Alert.alert('Email required', 'Go back to registration or login and provide your email.');
      return;
    }

    resendMutation.mutate(email, {
      onSuccess: (data) => {
        Alert.alert('Verification email', data.message);
      },
      onError: (error) => {
        Alert.alert('Could not resend', error.message);
      },
    });
  };

  return (
    <View style={styles.container}>
      <AppText variant="title">Verify email</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        Enter the verification code sent to {email || 'your email'}.
      </AppText>

      <AppInput placeholder="Verification code" value={token} onChangeText={setToken} />

      <AppButton title="Verify email" loading={verifyMutation.isPending} onPress={handleVerify} />

      <AppButton
        title="Resend verification email"
        variant="secondary"
        loading={resendMutation.isPending}
        onPress={handleResend}
      />

      <AppButton
        title="Back to sign in"
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
