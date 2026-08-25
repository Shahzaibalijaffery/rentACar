/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { App } from './src/App';
import { name as appName } from './app.json';
import { registerAndroidBackgroundHandler } from './src/features/notifications/android-push';

registerAndroidBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
