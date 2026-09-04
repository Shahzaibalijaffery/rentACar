import { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlanLimits, resolveUserPlan } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/i18n/use-locale';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppModeSwitcher } from '@/components/app-mode-switcher';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ProfileAvatar } from '@/components/profile-avatar';
import { PlanBadge } from '@/components/plan-badge';
import { QueryState } from '@/components/query-state';
import { ScreenLayout } from '@/components/screen-layout';
import { normalizeUploadMimeType } from '@/utils/image-url';
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
} from '@/api/hooks/use-auth';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing, useAppModeTheme } from '@/theme';
import { showAppAlert } from '@/stores/app-alert-store';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation('profile');
  const { intlTag } = useLocale();
  const theme = useAppModeTheme();
  const profileQuery = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadPhotoMutation = useUploadProfilePhotoMutation();
  const [fullName, setFullName] = useState('');
  const profile = profileQuery.data;
  const displayName = fullName !== '' ? fullName : (profile?.fullName ?? '');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: theme.mode === 'owner' ? t('ownerTitle') : t('renterTitle'),
      headerTintColor: theme.headerTint,
    });
  }, [navigation, t, theme.headerTint, theme.mode]);

  useEffect(() => {
    if (profile?.fullName) {
      setFullName(profile.fullName);
    }
  }, [profile?.fullName]);

  const handleSaveName = () => {
    if (!displayName.trim()) {
      showAppAlert(t('validation'), t('nameEmpty'));
      return;
    }

    updateProfileMutation.mutate(
      { fullName: displayName.trim() },
      {
        onSuccess: () => showAppAlert(t('saved'), t('savedBody')),
        onError: (error) => showAppAlert(t('updateFailed'), error.message),
      },
    );
  };

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const fileName = asset.fileName ?? 'profile.jpg';
    if (!asset.uri) {
      showAppAlert(t('photoError'), t('photoErrorBody'));
      return;
    }

    uploadPhotoMutation.mutate(
      {
        uri: asset.uri,
        type: normalizeUploadMimeType(asset.type, fileName),
        name: fileName,
      },
      {
        onError: (error) => showAppAlert(t('uploadFailed'), error.message),
      },
    );
  };

  return (
    <ScreenLayout>
      <QueryState
        isLoading={profileQuery.isLoading}
        isError={profileQuery.isError}
        errorMessage={profileQuery.error?.message}
      >
        {profile ? (
          <>
            <AppCard style={[styles.profileHeader, { backgroundColor: theme.heroBg, borderColor: theme.heroBg }]}>
              <View style={[styles.roleBadge, { backgroundColor: theme.heroBadgeBg }]}>
                <AppIcon name={theme.icon} size={14} color={theme.heroText} />
                <AppText variant="label" style={{ color: theme.heroText }}>
                  {theme.mode === 'owner' ? t('ownerWorkspace') : t('renterWorkspace')}
                </AppText>
              </View>
              <ProfileAvatar
                fullName={profile.fullName}
                profilePhotoUrl={profile.profilePhotoUrl}
                onEdit={() => {
                  void handlePickPhoto();
                }}
                editLoading={uploadPhotoMutation.isPending}
              />
              <AppText variant="heading" style={{ color: theme.heroText }}>
                {profile.fullName}
              </AppText>
              <PlanBadge plan={resolveUserPlan(profile.plan)} onPrimary />
              <AppText variant="caption" style={{ color: theme.heroMuted }}>
                {profile.email}
              </AppText>
            </AppCard>

            <AppCard>
              <AppText variant="label">{t('activeProfile')}</AppText>
              <AppText variant="caption" style={styles.note}>
                {t('activeProfileHint')}
              </AppText>
              <AppModeSwitcher compact />
            </AppCard>

            <AppCard>
              <LanguageSwitcher />
            </AppCard>

            <AppCard>
              <FormField
                label={t('fullName')}
                icon="user"
                placeholder={t('fullName')}
                value={displayName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <AppButton
                title={t('saveName')}
                icon="check"
                loading={updateProfileMutation.isPending}
                onPress={handleSaveName}
              />
              <AppButton
                title={t('changePassword')}
                icon="lock"
                variant="secondary"
                onPress={() => navigation.navigate('ChangePassword')}
              />
            </AppCard>

            <AppCard muted>
              <ProfileInfoRow icon="id" label={t('cnic')} value={profile.cnic} accent={theme.accent} muted={theme.accentMuted} />
              <AppText variant="caption" style={styles.note}>
                {t('cnicNote')}
              </AppText>
              <ProfileInfoRow icon="phone" label={t('phone')} value={profile.phone} accent={theme.accent} muted={theme.accentMuted} />
              <AppText variant="caption" style={styles.note}>
                {t('phoneNote')}
              </AppText>
            </AppCard>

            <AppCard muted>
              <ProfileInfoRow icon="badge" label={t('plan')} value={t(`plans.${resolveUserPlan(profile.plan)}`)} accent={theme.accent} muted={theme.accentMuted} />
              <ProfileInfoRow
                icon="car"
                label={t('listedVehicles')}
                value={t('upTo', { count: getPlanLimits(profile.plan).maxListedVehicles })}
                accent={theme.accent}
                muted={theme.accentMuted}
              />
              <ProfileInfoRow
                icon="camera"
                label={t('photosPerListing')}
                value={t('upTo', { count: getPlanLimits(profile.plan).maxVehiclePhotos })}
                accent={theme.accent}
                muted={theme.accentMuted}
              />
              <ProfileInfoRow
                icon="photo"
                label={t('evidencePhotos')}
                value={t('upTo', { count: getPlanLimits(profile.plan).maxHandoverPhotos })}
                accent={theme.accent}
                muted={theme.accentMuted}
              />
              <ProfileInfoRow icon="shield" label={t('status')} value={profile.status} accent={theme.accent} muted={theme.accentMuted} />
              <ProfileInfoRow
                icon="mail"
                label={t('emailVerified')}
                value={profile.emailVerified ? t('common:yes') : t('common:no')}
                accent={theme.accent}
                muted={theme.accentMuted}
              />
              <ProfileInfoRow
                icon="calendar"
                label={t('memberSince')}
                value={new Date(profile.createdAt).toLocaleDateString(intlTag)}
                accent={theme.accent}
                muted={theme.accentMuted}
              />
            </AppCard>
          </>
        ) : null}
      </QueryState>
    </ScreenLayout>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
  accent = colors.primary,
  muted = colors.primaryMuted,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  accent?: string;
  muted?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: muted }]}>
        <AppIcon name={icon} size={16} color={accent} />
      </View>
      <View style={styles.infoCopy}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="body">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  note: {
    color: colors.textSecondary,
  },
});
