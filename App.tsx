// import * as Sentry from 'sentry-expo';

// Sentry.init({
//   dsn: 'https://2ee085cec3774459876d706eac0fe6a5@o58488.ingest.sentry.io/4504039187742720',
//   enableInExpoDevelopment: true,
//   environment: __DEV__ ? 'development' : 'production',
//   debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
// });

import Main from './Main';

export default Main;

// import {
//   setJSExceptionHandler,
//   getJSExceptionHandler,
// } from 'react-native-exception-handler';
// import { Alert, Linking } from 'react-native';
// // For most use cases:
// // registering the error handler (maybe u can do this in the index.android.js or index.ios.js)
// setJSExceptionHandler((error, isFatal) => {
//   // This is your custom global error handler
//   // You do stuff like show an error dialog
//   // or hit google analytics to track crashes
//   // or hit a custom api to inform the dev team.  Alert.alert(error);
//   Alert.alert(error.message, error.stack);
//   Linking.openURL(
//     'https://www.baidu.com/s?wd=' +
//       encodeURIComponent(error.message + error.stack),
//   );
// });

// getJSExceptionHandler gives the currently set JS exception handler
// const currentHandler = getJSExceptionHandler();
