/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { App } from './src/App';
import { name as appName } from './app.json';

// Required by React Navigation on Android.
import 'react-native-gesture-handler';

AppRegistry.registerComponent(appName, () => App);
