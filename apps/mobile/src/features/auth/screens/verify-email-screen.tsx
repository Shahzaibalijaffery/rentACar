import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { ScreenLayout } from '@/components/screen-layout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useTranslation } from 'react-i18next';
import { useResendVerificationMutation, useVerifyEmailMutation } from '@/api/hooks/use-auth';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const { t } = useTranslation('auth');
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();
  const [token, setToken] = useState('');
  const email = route.params?.email ?? '';

  const handleVerify = () => {
    verifyMutation.mutate(token.trim(), {
      onSuccess: () => {
        Alert.alert(t('emailVerified'), t('emailVerifiedBody'), [
          { text: t('common:ok'), onPress: () => navigation.navigate('Login') },
        ]);
      },
      onError: (error) => {
        Alert.alert(t('verificationFailed'), error.message);
      },
    });
  };

  const handleResend = () => {
    if (!email) {
      Alert.alert(t('emailRequired'), t('emailRequiredBody'));
      return;
    }

    resendMutation.mutate(email, {
      onSuccess: (data) => {
        Alert.alert(t('verificationEmail'), data.message);
      },
      onError: (error) => {
        Alert.alert(t('couldNotResend'), error.message);
      },
    });
  };

  return (
    <ScreenLayout>
      <AppText variant="title">{t('verifyEmail')}</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        {t('verifyEmailHint', { email: email || t('yourEmail') })}
      </AppText>

      <AppInput
        icon="mail"
        placeholder={t('verificationCode')}
        value={token}
        onChangeText={setToken}
      />

      <AppButton
        title={t('verifyEmail')}
        icon="check"
        loading={verifyMutation.isPending}
        onPress={handleVerify}
      />

      <AppButton
        title={t('resendEmail')}
        icon="mail"
        variant="secondary"
        loading={resendMutation.isPending}
        onPress={handleResend}
      />

      <AppButton
        title={t('backToSignIn')}
        variant="secondary"
        onPress={() => navigation.navigate('Login')}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
