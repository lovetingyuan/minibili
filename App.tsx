import React, { ReactNode } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
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
import { getBlackUps } from './routes/Hot/blackUps';

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
          headerRight() {
            return (
              <Pressable
                onPress={async () => {
                  const blacks = await getBlackUps;
                  const blacksNum = Object.keys(blacks).length;
                  Alert.alert(
                    `关于 minibili (${require('./app.json').expo.version})`,
                    [
                      '',
                      '所有数据都来自B站官网，仅供学习交流',
                      '',
                      'https://github.com/lovetingyuan/minibili',
                      '',
                      blacksNum
                        ? `黑名单(${blacksNum})：\n${Object.values(blacks).join(
                            ', ',
                          )}`
                        : '',
                    ].join('\n'),
                  );
                }}>
                <Image
                  style={{ width: 16, height: 16, marginRight: 18, top: 3 }}
                  source={require('./assets/info.png')}
                />
              </Pressable>
            );
          },
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
  return (
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
  );
};
