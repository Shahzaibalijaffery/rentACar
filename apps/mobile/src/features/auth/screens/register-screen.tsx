import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { useTranslation } from 'react-i18next';
import { useRegisterMutation } from '@/api/hooks/use-auth';
import { registrationPasswordError } from '@/features/auth/registration-passwords';
import { showAppAlert } from '@/stores/app-alert-store';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation('auth');
  const registerMutation = useRegisterMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = () => {
    const passwordError = registrationPasswordError(password, confirmPassword);
    if (passwordError) {
      showAppAlert(t('registrationFailed'), t(passwordError));
      return;
    }

    registerMutation.mutate(
      { email, password, fullName, cnic, phone },
      {
        onSuccess: () => {
          navigation.navigate('VerifyEmail', { email: email.trim() });
        },
        onError: (error) => {
          showAppAlert(t('registrationFailed'), error.message);
        },
      },
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <AppText variant="title">{t('createAccountTitle')}</AppText>
        <AppText variant="body" style={styles.subtitle}>
          {t('createAccountHint')}
        </AppText>
      </View>

      <AppCard>
        <FormField
          label={t('fullName')}
          icon="user"
          placeholder={t('fullNamePlaceholder')}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
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
          label={t('cnic')}
          icon="id"
          placeholder={t('cnicPlaceholder')}
          keyboardType="number-pad"
          value={cnic}
          onChangeText={setCnic}
          hint={t('cnicHint')}
        />
        <FormField
          label={t('phone')}
          icon="phone"
          placeholder={t('phonePlaceholder')}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          hint={t('phoneHint')}
        />
        <FormField
          label={t('password')}
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
          title={t('createAccountCta')}
          icon="plus"
          loading={registerMutation.isPending}
          onPress={handleRegister}
        />
      </AppCard>

      <AppButton
        title={t('alreadyHaveAccount')}
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
