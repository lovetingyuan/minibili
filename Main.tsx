import React, { ReactNode } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Play from './routes/Play/Play';
import Follow from './routes/Follow';
import Dynamic from './routes/Dynamic';
import Hot from './routes/Hot';
import WebPage from './routes/WebPage';
import { checkWifi } from './hooks/useNetStatusToast';
import { RootStackParamList } from './types';
import { LabelPosition } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import CheckLiving from './components/CheckLiving';
import { Button } from '@rneui/base';
import store from './valtio/store';
import { useSnapshot } from 'valtio';
import { Badge } from '@rneui/base';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

SplashScreen.preventAutoHideAsync();
checkWifi();

const getLabel = (text: string, updatedCount?: number) => {
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
    if (text === '我的' && updatedCount) {
      return (
        <View>
          <Badge
            status="success"
            value={updatedCount >= 100 ? '99+' : updatedCount}
            badgeStyle={{
              height: 13,
              width: updatedCount >= 100 ? 26 : updatedCount < 10 ? 10 : 20,
              backgroundColor: '#fb7299',
              position: 'absolute',
              left: 24,
            }}
            textStyle={{ fontSize: 10 }}
            containerStyle={{
              marginLeft: 5,
            }}
          />
          <Text style={css.text}>{text}</Text>
        </View>
      );
    }
    return <Text style={css.text}>{text}</Text>;
  };
  return labelCmp;
};

const Main = () => {
  const { dynamicUser, updatedUps } = useSnapshot(store);
  const updateCount = Object.values(updatedUps).filter(Boolean).length;

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
        options={options => {
          return {
            tabBarLabel: getLabel('热门'),
            headerTitle: '🔥 热门' + (__DEV__ ? ' dev' : ''),
            headerTitleStyle: { fontSize: 18, color: '#555' },
            headerShown: true,
            headerRight() {
              return (
                <Pressable
                  onPress={() => {
                    options.navigation.setParams({
                      query: Date.now(),
                    });
                  }}>
                  <Image
                    source={require('./assets/filter.png')}
                    style={{ width: 16, height: 16, marginRight: 16 }}
                  />
                </Pressable>
              );
            },
          };
        }}
      />
      {dynamicUser.mid ? (
        <Tab.Screen
          name="Dynamic"
          component={Dynamic}
          options={{
            tabBarLabel: getLabel('动态'),
          }}
        />
      ) : null}
      <Tab.Screen
        name="Follow"
        component={Follow}
        options={{
          tabBarLabel: getLabel('我的', updateCount),
        }}
      />
    </Tab.Navigator>
  );
};

export default () => {
  const { webViewMode } = useSnapshot(store);

  return (
    <>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" />
      <NavigationContainer>
        <CheckLiving />
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
                headerRight() {
                  return (
                    <Pressable
                      onPress={() => {
                        Linking.openURL(
                          `bilibili://video/${props.route.params.bvid}`,
                        ).catch(err => {
                          if (
                            err.message.includes(
                              'No Activity found to handle Intent',
                            )
                          ) {
                            props.navigation.navigate('WebPage', {
                              title: props.route.params.name + '的动态',
                              url:
                                'https://m.bilibili.com/video/' +
                                props.route.params.bvid,
                            });
                          }
                        });
                      }}>
                      <Image
                        style={{ width: 36, height: 14 }}
                        source={require('./assets/bili-text.png')}
                      />
                    </Pressable>
                  );
                },
              };
            }}
          />
          <Stack.Screen
            name="WebPage"
            component={WebPage}
            options={props => {
              return {
                title: props.route.params.title,
                headerRight() {
                  return (
                    <Button
                      titleStyle={{ fontSize: 13 }}
                      onPress={() => {
                        store.webViewMode =
                          webViewMode === 'MOBILE' ? 'PC' : 'MOBILE';
                      }}
                      size="sm"
                      type="clear">
                      {webViewMode === 'MOBILE' ? '电脑模式' : '手机模式'}
                    </Button>
                  );
                },
              };
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};
