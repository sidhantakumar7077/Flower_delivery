/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const Root = () => (
    <SafeAreaProvider>
        <SafeAreaView
            style={{ flex: 1, backgroundColor: '#1E293B' }} // change bg if you want
            edges={['top', 'bottom']}                       // protect top & bottom
        >
            <App />
        </SafeAreaView>
    </SafeAreaProvider>
);

AppRegistry.registerComponent(appName, () => Root);
