import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RentalLifecycleFilter } from '@rentacar/shared';
import { EmptyState } from '@/components/empty-state';
import { QueryState } from '@/components/query-state';
import { ScreenLayout } from '@/components/screen-layout';
import { useIncomingRentalsQuery } from '@/api/hooks/use-rentals';
import { RentalLifecycleTabs } from '@/features/rentals/components/rental-lifecycle-tabs';
import { RentalListItem } from '@/features/rentals/components/rental-list-item';
import type { AppStackParamList } from '@/navigation/types';
import { spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'OwnerRentalRequests'>;

function emptyCopy(lifecycle: RentalLifecycleFilter): { title: string; message: string } {
  switch (lifecycle) {
    case 'active':
      return {
        title: 'No active rentals',
        message: 'Active rentals on your vehicles will show up here.',
      };
    case 'completed':
      return {
        title: 'No completed rentals',
        message: 'Completed trips on your vehicles will appear here.',
      };
    default:
      return {
        title: 'No incoming requests',
        message: 'When renters request your vehicles, they will appear here.',
      };
  }
}

export function OwnerRentalRequestsScreen({ navigation, route }: Props) {
  const initialLifecycle = route.params?.lifecycle ?? 'all';
  const [lifecycle, setLifecycle] = useState<RentalLifecycleFilter>(initialLifecycle);
  const rentalsQuery = useIncomingRentalsQuery(lifecycle);
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
                perspective="owner"
                onPress={() =>
                  navigation.navigate('RentalRequestDetail', {
                    rentalId: item.id,
                    perspective: 'owner',
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
