import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoveryScreen } from '@/features/discovery/screens/discovery-screen';
import { DiscoveryVehicleDetailScreen } from '@/features/discovery/screens/discovery-vehicle-detail-screen';
import { HomeScreen } from '@/features/home/screens/home-screen';
import { ProfileScreen } from '@/features/profile/screens/profile-screen';
import { AddVehicleScreen } from '@/features/vehicles/screens/add-vehicle-screen';
import { EditVehicleScreen } from '@/features/vehicles/screens/edit-vehicle-screen';
import { MyVehiclesScreen } from '@/features/vehicles/screens/my-vehicles-screen';
import { VehicleDetailsScreen } from '@/features/vehicles/screens/vehicle-details-screen';
import { MyRentalRequestsScreen } from '@/features/rentals/screens/my-rental-requests-screen';
import { OwnerRentalRequestsScreen } from '@/features/rentals/screens/owner-rental-requests-screen';
import { RentalRequestDetailScreen } from '@/features/rentals/screens/rental-request-detail-screen';
import { CreateAgreementScreen } from '@/features/agreements/screens/create-agreement-screen';
import { AgreementDetailScreen } from '@/features/agreements/screens/agreement-detail-screen';
import { PickupHandoverScreen } from '@/features/handovers/screens/pickup-handover-screen';
import { ProfileSearchScreen } from '@/features/users/screens/profile-search-screen';
import type { AppStackParamList } from '@/navigation/types';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '600' as const },
  contentStyle: { backgroundColor: colors.background },
};

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'RentACar' }} />
      <Stack.Screen
        name="ProfileSearch"
        component={ProfileSearchScreen}
        options={{ title: 'Search by CNIC' }}
      />
      <Stack.Screen name="Discovery" component={DiscoveryScreen} options={{ title: 'Discover' }} />
      <Stack.Screen
        name="DiscoveryVehicleDetail"
        component={DiscoveryVehicleDetailScreen}
        options={{ title: 'Vehicle details' }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My profile' }} />
      <Stack.Screen
        name="MyVehicles"
        component={MyVehiclesScreen}
        options={{ title: 'My vehicles' }}
      />
      <Stack.Screen
        name="AddVehicle"
        component={AddVehicleScreen}
        options={{ title: 'Add vehicle' }}
      />
      <Stack.Screen
        name="EditVehicle"
        component={EditVehicleScreen}
        options={{ title: 'Edit vehicle' }}
      />
      <Stack.Screen
        name="VehicleDetails"
        component={VehicleDetailsScreen}
        options={{ title: 'Vehicle details' }}
      />
      <Stack.Screen
        name="MyRentalRequests"
        component={MyRentalRequestsScreen}
        options={{ title: 'My rentals' }}
      />
      <Stack.Screen
        name="OwnerRentalRequests"
        component={OwnerRentalRequestsScreen}
        options={{ title: 'Incoming requests' }}
      />
      <Stack.Screen
        name="RentalRequestDetail"
        component={RentalRequestDetailScreen}
        options={{ title: 'Rental details' }}
      />
      <Stack.Screen
        name="CreateAgreement"
        component={CreateAgreementScreen}
        options={{ title: 'Create agreement' }}
      />
      <Stack.Screen
        name="AgreementDetail"
        component={AgreementDetailScreen}
        options={{ title: 'Rental agreement' }}
      />
      <Stack.Screen
        name="PickupHandover"
        component={PickupHandoverScreen}
        options={{ title: 'Pickup photos' }}
      />
    </Stack.Navigator>
  );
}
