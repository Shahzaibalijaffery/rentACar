import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLoginMutation } from '@/api/hooks/use-auth';
import { ApiError } from '@/api/errors';
import { showAppAlert } from '@/stores/app-alert-store';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation('auth');
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    loginMutation.mutate(
      { email, password },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.errorCode === 'EMAIL_NOT_VERIFIED') {
            navigation.navigate('VerifyEmail', { email: email.trim() });
            return;
          }
          showAppAlert(t('signInFailed'), error.message);
        },
      },
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <AppIcon name="car" size={28} color={colors.primary} />
        </View>
        <AppText variant="display" style={styles.brand}>
          {t('common:appName')}
        </AppText>
        <AppText variant="body" style={styles.subtitle}>
          {t('tagline')}
        </AppText>
      </View>

      <AppCard>
        <AppText variant="heading">{t('welcomeBack')}</AppText>
        <AppText variant="caption" style={styles.cardHint}>
          {t('signInHint')}
        </AppText>

        <FormField
          label={t('email')}
          icon="mail"
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label={t('password')}
          icon="lock"
          placeholder={t('passwordPlaceholder')}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />

        <AppButton
          title={t('forgotPassword')}
          variant="ghost"
          size="sm"
          onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() || undefined })}
        />

        <AppButton
          title={t('signIn')}
          icon="key"
          loading={loginMutation.isPending}
          onPress={handleLogin}
        />
      </AppCard>

      <AppButton
        title={t('createAccount')}
        icon="plus"
        variant="secondary"
        onPress={() => navigation.navigate('Register')}
      />
      <LanguageSwitcher />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: colors.primary,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  cardHint: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
