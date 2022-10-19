import React, { ReactNode } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  Alert,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext, AppContextValue, UserInfo } from './context';
import { TracyId, TracyInfo } from './constants';
import CheckLiving from './components/CheckLiving';
import { Button } from '@rneui/themed';
import { getBlackUps } from './routes/Hot/blackUps';
import { getBlackTags } from './routes/Hot/blackTags';
// import useDialog from './hooks/useDialog';

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

const showFilter = () => {
  Promise.all([getBlackUps, getBlackTags]).then(([blackUps, tags]) => {
    Alert.alert(
      '黑名单',
      (Object.keys(blackUps).length
        ? `UP(${Object.keys(blackUps).length})：${Object.values(blackUps)
            .filter(v => typeof v === 'string')
            .join(', ')}`
        : 'UP：暂无') +
        '\n\n' +
        (Object.keys(tags).length
          ? `类型：${Object.keys(tags).join(', ')}`
          : '类型：暂无'),
    );
  });
};

// const HotComp = (props, dialog) => {
//   return (
//     <>
//       {dialog}
//       <Hot {...props} />
//     </>
//   );
// };

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
  const [userInfo, _setUserInfo] = React.useState<UserInfo>({
    name: '',
    sign: '',
    mid: '',
    face: '',
  });
  const [specialUser, _setSpecialUser] = React.useState<UserInfo>(TracyInfo);
  const [playedVideos, _setPlayedVideos] = React.useState<
    Record<string, boolean>
  >({});
  React.useEffect(() => {
    AsyncStorage.getItem('USER_INFO').then(res => {
      if (res) {
        try {
          _setUserInfo(JSON.parse(res));
        } catch (e) {
          _setUserInfo({
            name: '',
            mid: '',
            face: '',
            sign: '',
          });
        }
      }
    });
    AsyncStorage.getItem('SPECIAL_USER').then(res => {
      if (res) {
        _setSpecialUser(JSON.parse(res));
      }
    });
    AsyncStorage.getItem('WEBVIEW_MODE').then(res => {
      const mode = (res || 'MOBILE') as AppContextValue['webviewMode'];
      _setWebviewMode(mode);
    });
    AsyncStorage.getItem('PLAYED_VIDEOS').then(res => {
      if (res) {
        _setPlayedVideos(JSON.parse(res));
      }
    });
  }, []);

  const setUserInfo = (user: UserInfo) => {
    AsyncStorage.setItem('USER_INFO', JSON.stringify(user)).then(() => {
      _setUserInfo(user);
    });
  };
  const setSpecialUser = (user: UserInfo) => {
    AsyncStorage.setItem('SPECIAL_USER', JSON.stringify(user)).then(() => {
      _setSpecialUser(user);
    });
  };
  const [webviewMode, _setWebviewMode] =
    React.useState<AppContextValue['webviewMode']>('MOBILE');
  const setWebviewMode = (mode: AppContextValue['webviewMode']) => {
    AsyncStorage.setItem('WEBVIEW_MODE', mode);
    _setWebviewMode(mode);
  };
  const setPlayedVideos = (bvid: string) => {
    const played = { ...playedVideos, [bvid]: true };
    _setPlayedVideos(played);
    AsyncStorage.setItem('PLAYED_VIDEOS', JSON.stringify(played));
  };
  return (
    <AppContext.Provider
      value={{
        userInfo,
        specialUser,
        setUserInfo,
        setSpecialUser,
        webviewMode,
        setWebviewMode,
        playedVideos,
        setPlayedVideos,
        defaultMid: TracyId.toString(),
      }}>
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
                        if (webviewMode === 'MOBILE') {
                          setWebviewMode('PC');
                        } else {
                          setWebviewMode('MOBILE');
                        }
                      }}
                      size="sm"
                      type="clear">
                      {webviewMode === 'MOBILE' ? '电脑模式' : '手机模式'}
                    </Button>
                  );
                },
              };
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
};
