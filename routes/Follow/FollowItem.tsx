import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { getFollowUps, getUserInfo, TracyId } from '../../services/Bilibili';
import { Avatar } from '@rneui/themed';
import { checkDynamics } from '../../services/Updates';
import { useNavigation } from '@react-navigation/native';
import { GetFuncPromiseType, RootStackParamList } from '../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@rneui/base';

type UpItem = GetFuncPromiseType<typeof getFollowUps>['list'][0];
type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function FollowItem(props: UpItem) {
  const { face, name, sign, mid } = props;
  const tracyStyle: Record<string, any> = {};
  const isTracy = mid === TracyId;
  if (isTracy) {
    tracyStyle.color = '#fb7299';
    tracyStyle.fontSize = 18;
  }
  const [updatedId, setUpdatedId] = React.useState(0);
  const [livingInfo, setLiving] = React.useState<{
    living: boolean;
    liveUrl?: string;
  } | null>(null);
  const navigation = useNavigation<NavigationProps['navigation']>();

  React.useEffect(() => {
    const check = async () => {
      const dynamicId = await checkDynamics(mid);
      if (dynamicId) {
        setUpdatedId(dynamicId);
      }
      const { living, liveUrl } = await getUserInfo(mid);
      setLiving({
        living,
        liveUrl,
      });
    };
    check();
    const timer = setInterval(check, 5 * 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [mid]);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('Dynamic', { mid, face, name, sign });
        setUpdatedId(0);
      }}>
      <View style={styles.container}>
        <Avatar
          size={56}
          containerStyle={{ marginRight: 14 }}
          rounded
          source={{ uri: face + (isTracy ? '' : '@120w_120h_1c.webp') }}
        />
        <View style={{ flex: 1 }}>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, tracyStyle]}>{name}</Text>
            {updatedId ? (
              <Image
                style={styles.newIcon}
                source={require('../../assets/new.png')}
              />
            ) : null}
          </View>
          {sign ? (
            <Text style={styles.signText} numberOfLines={2}>
              {sign}
            </Text>
          ) : null}
        </View>
        {livingInfo?.living ? (
          <Button
            title="直播中~"
            type="clear"
            titleStyle={{ fontSize: 13 }}
            onPress={() => {
              if (livingInfo.liveUrl) {
                navigation.navigate('WebPage', {
                  url: livingInfo.liveUrl,
                  title: name + '的直播间',
                });
              }
            }}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    paddingRight: 20,
  },
  face: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  nameContainer: { flexDirection: 'row', alignItems: 'center' },
  name: {
    fontSize: 16,
    marginBottom: 3,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    flexWrap: 'wrap',
  },
  newIcon: { width: 28, height: 11, marginLeft: 10, top: -1 },
  signText: { color: '#555', marginTop: 2, fontSize: 13 },
  liveText: { color: '#008AC5', fontSize: 14, marginLeft: 12, marginRight: 5 },
});
