import React, { ReactNode } from 'react';
import { StatusBar, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Play from './routes/Play';
import Follow from './routes/Follow';
import Dynamic from './routes/Dynamic';
import Hot from './routes/Hot';
import './services/Living';
import WebPage from './routes/WebPage';
import { checkWifi } from './hooks/useNetStatusToast';
import { RootStackParamList } from './types';
import { LabelPosition } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
// import { getBlackUps } from './routes/Hot/blackUps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext, SpecialUser } from './context';

const TracyId = 1458143131;

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

SplashScreen.preventAutoHideAsync();
checkWifi();

const getLabel = (text: string) => {
  const labelCmp: (props: {
    focused: boolean;
    color: string;
    position: LabelPosition;
  }) => ReactNode = props => {
    const css = StyleSheet.create({
      text: {
        color: props.color,
        fontSize: props.focused ? 17 : 16,
        fontWeight: props.focused ? 'bold' : 'normal',
      },
    });
    return <Text style={css.text}>{text}</Text>;
  };
  return labelCmp;
};

const Main = () => {
  return (
    <Tab.Navigator
      initialRouteName="Hot"
      screenOptions={{
        headerShown: false,
        tabBarIconStyle: {
          display: 'none',
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 16,
        },
        tabBarActiveTintColor: '#FB7299',
      }}>
      <Tab.Screen
        name="Hot"
        component={Hot}
        options={{
          tabBarLabel: getLabel('热门'),
          headerTitle: '🔥 热门' + (__DEV__ ? ' dev' : ''),
          headerTitleStyle: { fontSize: 18, color: '#555' },
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Dynamic"
        component={Dynamic}
        options={{
          tabBarLabel: getLabel('动态'),
        }}
      />
      <Tab.Screen
        name="Follow"
        component={Follow}
        options={{
          tabBarLabel: getLabel('我的'),
        }}
      />
    </Tab.Navigator>
  );
};

export default () => {
  const [userId, _setUserId] = React.useState('');
  const [specialUser, _setSpecialUser] = React.useState<SpecialUser>({
    mid: TracyId.toString(),
    name: '侯翠翠',
    face: 'https://i1.hdslb.com/bfs/face/2c7c282460812e14a3266f338d563b3ef4b1b009.jpg',
  });
  React.useEffect(() => {
    AsyncStorage.getItem('USER_ID').then(res => {
      setUserId(res || '');
    });
    AsyncStorage.getItem('SPECIAL_USER').then(res => {
      if (res) {
        setSpecialUser(JSON.parse(res));
      }
    });
  }, []);
  const setUserId = (mid: string) => {
    AsyncStorage.setItem('USER_ID', mid).then(() => {
      _setUserId(mid);
    });
  };
  const setSpecialUser = (user: SpecialUser) => {
    AsyncStorage.setItem('SPECIAL_USER', JSON.stringify(user)).then(() => {
      _setSpecialUser(user);
    });
  };
  return (
    <AppContext.Provider
      value={{
        userId,
        specialUser,
        setUserId,
        setSpecialUser,
        defaultMid: TracyId.toString(),
      }}>
      <NavigationContainer>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" />
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerTitleStyle: {
              fontSize: 18,
              color: '#555',
            },
          }}>
          <Stack.Screen
            name="Main"
            component={Main}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Play"
            component={Play}
            options={props => {
              return {
                title: props.route.params.name,
              };
            }}
          />
          <Stack.Screen
            name="WebPage"
            component={WebPage}
            options={props => {
              return {
                title: props.route.params.title,
              };
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
};
