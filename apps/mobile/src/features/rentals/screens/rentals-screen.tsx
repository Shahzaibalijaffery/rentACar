import { useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RentalLifecycleFilter } from '@rentacar/shared';
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

function emptyCopy(
  perspective: 'owner' | 'renter',
  lifecycle: RentalLifecycleFilter,
): { title: string; message: string } {
  if (lifecycle === 'active') {
    return {
      title: 'No active rentals',
      message:
        perspective === 'owner'
          ? 'Active rentals on your vehicles will show up here.'
          : 'When a rental is in progress, it will show up here.',
    };
  }

  if (lifecycle === 'completed') {
    return {
      title: 'No completed rentals',
      message:
        perspective === 'owner'
          ? 'Completed trips on your vehicles will appear here.'
          : 'Finished trips will appear in this list.',
    };
  }

  return perspective === 'owner'
    ? {
        title: 'No rentals yet',
        message: 'When renters request your vehicles, they will appear here.',
      }
    : {
        title: 'No rentals yet',
        message: 'Discover vehicles and send your first rental request.',
      };
}

export function RentalsScreen({ navigation }: Props) {
  const isOwnerMode = useAppModeStore((state) => state.activeMode) === 'owner';
  const perspective = isOwnerMode ? 'owner' : 'renter';
  const [lifecycle, setLifecycle] = useState<RentalLifecycleFilter>('all');
  const mineQuery = useMyRentalsQuery(lifecycle, !isOwnerMode);
  const incomingQuery = useIncomingRentalsQuery(lifecycle, isOwnerMode);
  const rentalsQuery = isOwnerMode ? incomingQuery : mineQuery;
  const empty = emptyCopy(perspective, lifecycle);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Rentals' });
  }, [navigation]);

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
