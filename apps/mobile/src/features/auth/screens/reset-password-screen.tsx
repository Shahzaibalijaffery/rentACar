import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { useTranslation } from 'react-i18next';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/api/hooks/use-auth';
import { passwordPairError } from '@/features/auth/registration-passwords';
import { showAppAlert } from '@/stores/app-alert-store';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

export function ResetPasswordScreen({ route, navigation }: Props) {
  const { t } = useTranslation('auth');
  const resetMutation = useResetPasswordMutation();
  const resendMutation = useForgotPasswordMutation();
  const email = route.params.email;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleReset = () => {
    const normalizedCode = digitsOnly(code);
    if (normalizedCode.length !== 6) {
      showAppAlert(t('resetFailed'), t('codeRequired'));
      return;
    }

    const passwordError = passwordPairError(password, confirmPassword);
    if (passwordError) {
      showAppAlert(t('resetFailed'), t(passwordError));
      return;
    }

    resetMutation.mutate(
      { email, code: normalizedCode, newPassword: password },
      {
        onSuccess: () => {
          showAppAlert(t('passwordUpdated'), t('passwordUpdatedBody'), [
            { text: t('common:ok'), onPress: () => navigation.navigate('Login') },
          ]);
        },
        onError: (error) => {
          showAppAlert(t('resetFailed'), error.message);
        },
      },
    );
  };

  const handleResend = () => {
    resendMutation.mutate(
      { email },
      {
        onSuccess: (data) => {
          showAppAlert(t('resetEmailSent'), data.message);
        },
        onError: (error) => {
          showAppAlert(t('couldNotResend'), error.message);
        },
      },
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <AppText variant="title">{t('resetPasswordTitle')}</AppText>
        <AppText variant="caption" style={styles.subtitle}>
          {t('resetPasswordHint', { email })}
        </AppText>
      </View>

      <AppCard>
        <AppText variant="label">{t('verificationCode')}</AppText>
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
        <FormField
          label={t('newPassword')}
          icon="lock"
          placeholder={t('passwordNewPlaceholder')}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
        />
        <FormField
          label={t('confirmPassword')}
          icon="lock"
          placeholder={t('confirmPasswordPlaceholder')}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <AppButton
          title={t('updatePassword')}
          icon="check"
          loading={resetMutation.isPending}
          onPress={handleReset}
        />
      </AppCard>

      <AppButton
        title={t('resendResetCode')}
        variant="secondary"
        icon="mail"
        loading={resendMutation.isPending}
        onPress={handleResend}
      />
      <AppButton
        title={t('backToSignIn')}
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
    marginBottom: spacing.sm,
  },
});
