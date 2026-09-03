import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { useTranslation } from 'react-i18next';
import { useForgotPasswordMutation } from '@/api/hooks/use-auth';
import { showAppAlert } from '@/stores/app-alert-store';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ route, navigation }: Props) {
  const { t } = useTranslation('auth');
  const forgotMutation = useForgotPasswordMutation();
  const [email, setEmail] = useState(route.params?.email ?? '');

  const handleSend = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      showAppAlert(t('emailRequired'), t('emailRequiredBody'));
      return;
    }

    forgotMutation.mutate(
      { email: normalizedEmail },
      {
        onSuccess: (data) => {
          showAppAlert(t('resetEmailSent'), data.message, [
            {
              text: t('common:ok'),
              onPress: () => navigation.navigate('ResetPassword', { email: normalizedEmail }),
            },
          ]);
        },
        onError: (error) => {
          showAppAlert(t('resetFailed'), error.message);
        },
      },
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <AppText variant="title">{t('forgotPasswordTitle')}</AppText>
        <AppText variant="body" style={styles.subtitle}>
          {t('forgotPasswordHint')}
        </AppText>
      </View>

      <AppCard>
        <FormField
          label={t('email')}
          icon="mail"
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <AppButton
          title={t('sendResetCode')}
          icon="mail"
          loading={forgotMutation.isPending}
          onPress={handleSend}
        />
      </AppCard>

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
  },
});
