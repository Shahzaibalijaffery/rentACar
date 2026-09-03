import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { useTranslation } from 'react-i18next';
import { useChangePasswordMutation } from '@/api/hooks/use-auth';
import { passwordPairError } from '@/features/auth/registration-passwords';
import { showAppAlert } from '@/stores/app-alert-store';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const { t } = useTranslation('auth');
  const changeMutation = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = () => {
    if (!currentPassword) {
      showAppAlert(t('changePasswordFailed'), t('currentPasswordRequired'));
      return;
    }

    const passwordError = passwordPairError(password, confirmPassword);
    if (passwordError) {
      showAppAlert(t('changePasswordFailed'), t(passwordError));
      return;
    }

    changeMutation.mutate(
      { currentPassword, newPassword: password },
      {
        onSuccess: () => {
          showAppAlert(t('passwordUpdated'), t('passwordChangedBody'), [
            { text: t('common:ok'), onPress: () => navigation.goBack() },
          ]);
        },
        onError: (error) => {
          showAppAlert(t('changePasswordFailed'), error.message);
        },
      },
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <AppText variant="title">{t('changePasswordTitle')}</AppText>
        <AppText variant="body" style={styles.subtitle}>
          {t('changePasswordHint')}
        </AppText>
      </View>

      <AppCard>
        <FormField
          label={t('currentPassword')}
          icon="lock"
          placeholder={t('passwordPlaceholder')}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
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
          loading={changeMutation.isPending}
          onPress={handleChange}
        />
      </AppCard>
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
