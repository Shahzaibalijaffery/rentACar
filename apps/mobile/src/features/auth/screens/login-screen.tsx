import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
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
    <ScreenLayout>
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <AppIcon name="car" size={28} color={colors.primary} />
        </View>
        <AppText variant="display" style={styles.brand}>
          RentACar
        </AppText>
        <AppText variant="body" style={styles.subtitle}>
          Peer-to-peer car rental, simplified.
        </AppText>
      </View>

      <AppCard>
        <AppText variant="heading">Welcome back</AppText>
        <AppText variant="caption" style={styles.cardHint}>
          Sign in to continue as a renter or owner.
        </AppText>

        <FormField
          label="Email"
          icon="mail"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="Password"
          icon="lock"
          placeholder="Your password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />

        <AppButton
          title="Sign in"
          icon="key"
          loading={loginMutation.isPending}
          onPress={handleLogin}
        />
      </AppCard>

      <AppButton
        title="Create an account"
        icon="plus"
        variant="secondary"
        onPress={() => navigation.navigate('Register')}
      />
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
