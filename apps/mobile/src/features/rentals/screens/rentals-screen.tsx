import { useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RentalLifecycleFilter } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { QueryState } from '@/components/query-state';
import { ScreenLayout } from '@/components/screen-layout';
import { useIncomingRentalsQuery, useMyRentalsQuery } from '@/api/hooks/use-rentals';
import { RentalLifecycleTabs } from '@/features/rentals/components/rental-lifecycle-tabs';
import { RentalListItem } from '@/features/rentals/components/rental-list-item';
import type { AppStackParamList } from '@/navigation/types';
import { useAppModeStore } from '@/stores/app-mode-store';
import { spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Rentals'>;

export function RentalsScreen({ navigation }: Props) {
  const { t } = useTranslation('rentals');
  const isOwnerMode = useAppModeStore((state) => state.activeMode) === 'owner';
  const perspective = isOwnerMode ? 'owner' : 'renter';
  const [lifecycle, setLifecycle] = useState<RentalLifecycleFilter>('all');
  const mineQuery = useMyRentalsQuery(lifecycle, !isOwnerMode);
  const incomingQuery = useIncomingRentalsQuery(lifecycle, isOwnerMode);
  const rentalsQuery = isOwnerMode ? incomingQuery : mineQuery;
  const empty =
    lifecycle === 'active'
      ? {
          title: t('emptyActiveTitle'),
          message: perspective === 'owner' ? t('emptyActiveOwner') : t('emptyActiveRenter'),
        }
      : lifecycle === 'completed'
        ? {
            title: t('emptyCompletedTitle'),
            message:
              perspective === 'owner' ? t('emptyCompletedOwner') : t('emptyCompletedRenter'),
          }
        : {
            title: t('emptyAllTitle'),
            message: perspective === 'owner' ? t('emptyAllOwner') : t('emptyAllRenter'),
          };

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('title') });
  }, [navigation, t]);

  return (
    <ScreenLayout scroll={false} contentStyle={styles.content}>
      <RentalLifecycleTabs value={lifecycle} onChange={setLifecycle} />

      <QueryState
        isLoading={rentalsQuery.isLoading}
        isError={rentalsQuery.isError}
        errorMessage={rentalsQuery.error?.message}
      >
        {rentalsQuery.data && rentalsQuery.data.length === 0 ? (
          <EmptyState
            title={empty.title}
            message={empty.message}
            icon={lifecycle === 'completed' ? 'check' : lifecycle === 'active' ? 'clock' : 'car'}
          />
        ) : (
          <FlatList
            data={rentalsQuery.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <RentalListItem
                rental={item}
                perspective={perspective}
                onPress={() =>
                  navigation.navigate('RentalRequestDetail', {
                    rentalId: item.id,
                    perspective,
                  })
                }
              />
            )}
          />
        )}
      </QueryState>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.md,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
