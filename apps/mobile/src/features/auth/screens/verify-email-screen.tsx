import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScreenLayout } from '@/components/screen-layout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useTranslation } from 'react-i18next';
import { useResendVerificationMutation, useVerifyEmailMutation } from '@/api/hooks/use-auth';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { showAppAlert } from '@/stores/app-alert-store';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

export function VerifyEmailScreen({ route, navigation }: Props) {
  const { t } = useTranslation('auth');
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();
  const [code, setCode] = useState('');
  const email = route.params?.email ?? '';

  const handleVerify = () => {
    if (!email) {
      showAppAlert(t('emailRequired'), t('emailRequiredBody'));
      return;
    }

    const normalizedCode = digitsOnly(code);
    if (normalizedCode.length !== 6) {
      showAppAlert(t('verificationFailed'), t('codeRequired'));
      return;
    }

    verifyMutation.mutate(
      { email, code: normalizedCode },
      {
        onSuccess: () => {
          showAppAlert(t('emailVerified'), t('emailVerifiedBody'), [
            { text: t('common:ok'), onPress: () => navigation.navigate('Login') },
          ]);
        },
        onError: (error) => {
          showAppAlert(t('verificationFailed'), error.message);
        },
      },
    );
  };

  const handleResend = () => {
    if (!email) {
      showAppAlert(t('emailRequired'), t('emailRequiredBody'));
      return;
    }

    resendMutation.mutate(email, {
      onSuccess: (data) => {
        showAppAlert(t('verificationEmail'), data.message);
      },
      onError: (error) => {
        showAppAlert(t('couldNotResend'), error.message);
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
        value={code}
        onChangeText={(value) => setCode(digitsOnly(value))}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={6}
        autoCorrect={false}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
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
