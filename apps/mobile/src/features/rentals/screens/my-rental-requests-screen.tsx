import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RentalLifecycleFilter } from '@rentacar/shared';
import { EmptyState } from '@/components/empty-state';
import { QueryState } from '@/components/query-state';
import { ScreenLayout } from '@/components/screen-layout';
import { useMyRentalsQuery } from '@/api/hooks/use-rentals';
import { RentalLifecycleTabs } from '@/features/rentals/components/rental-lifecycle-tabs';
import { RentalListItem } from '@/features/rentals/components/rental-list-item';
import type { AppStackParamList } from '@/navigation/types';
import { spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MyRentalRequests'>;

function emptyCopy(lifecycle: RentalLifecycleFilter): { title: string; message: string } {
  switch (lifecycle) {
    case 'active':
      return {
        title: 'No active rentals',
        message: 'When a rental is in progress, it will show up here.',
      };
    case 'completed':
      return {
        title: 'No completed rentals',
        message: 'Finished trips will appear in this list.',
      };
    default:
      return {
        title: 'No requests yet',
        message: 'Discover vehicles and send your first rental request.',
      };
  }
}

export function MyRentalRequestsScreen({ navigation, route }: Props) {
  const initialLifecycle = route.params?.lifecycle ?? 'all';
  const [lifecycle, setLifecycle] = useState<RentalLifecycleFilter>(initialLifecycle);
  const rentalsQuery = useMyRentalsQuery(lifecycle);
  const empty = emptyCopy(lifecycle);

  return (
    <ScreenLayout scroll={false} contentStyle={styles.content}>
      <RentalLifecycleTabs value={lifecycle} onChange={setLifecycle} />

      <QueryState
        isLoading={rentalsQuery.isLoading}
        isError={rentalsQuery.isError}
        errorMessage={rentalsQuery.error?.message}
      >
        {rentalsQuery.data && rentalsQuery.data.length === 0 ? (
          <EmptyState title={empty.title} message={empty.message} />
        ) : (
          <FlatList
            data={rentalsQuery.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <RentalListItem
                rental={item}
                perspective="renter"
                onPress={() =>
                  navigation.navigate('RentalRequestDetail', {
                    rentalId: item.id,
                    perspective: 'renter',
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
