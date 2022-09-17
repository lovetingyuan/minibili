import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { getFollowUps, getUserInfo, TracyId } from '../../services/Bilibili';
import { Avatar } from '@rneui/themed';
import { checkDynamics, setLatest } from '../../services/Updates';
import { useNavigation } from '@react-navigation/native';
import { GetFuncPromiseType, RootStackParamList } from '../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Overlay } from '@rneui/base';
import useMemoizedFn from '../../hooks/useMemoizedFn';

if (!Promise.allSettled) {
  const rejectHandler = (reason: any) => ({ status: 'rejected', reason });

  const resolveHandler = (value: any) => ({ status: 'fulfilled', value });

  (Promise as any).allSettled = function (promises: any[]) {
    const convertedPromises = promises.map(p =>
      Promise.resolve(p).then(resolveHandler, rejectHandler),
    );
    return Promise.all(convertedPromises);
  };
}

type UpItem = GetFuncPromiseType<typeof getFollowUps>['list'][0];
type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function FollowItem(props: {
  item: UpItem;
  startUpdate: number;
}) {
  const {
    item: { face, name, sign, mid },
    startUpdate,
  } = props;
  const tracyStyle: Record<string, any> = {};
  const isTracy = mid === TracyId;
  if (isTracy) {
    tracyStyle.color = '#fb7299';
    tracyStyle.fontSize = 18;
  }
  const [updatedId, setUpdatedId] = React.useState('');
  const [livingInfo, setLiving] = React.useState<{
    living: boolean;
    liveUrl?: string;
  } | null>(null);
  const navigation = useNavigation<NavigationProps['navigation']>();
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (loading) {
      return;
    }
    setLoading(true);
    Promise.allSettled([checkDynamics(mid), getUserInfo(mid)])
      .then(([a, b]) => {
        if (a.status === 'fulfilled' && a.value) {
          setUpdatedId(a.value);
        }
        if (b.status === 'fulfilled') {
          const { living, liveUrl } = b.value;
          setLiving({
            living,
            liveUrl,
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startUpdate, mid]);

  const [modalVisible, setModalVisible] = React.useState(false);
  const markNew = useMemoizedFn(() => {
    const random = Math.random().toString().slice(2, 10);
    setLatest(mid, random);
    setUpdatedId(random);
    // toggleOverlay();
    setModalVisible(false);
  });
  const hideModal = useMemoizedFn(() => {
    setModalVisible(false);
  });
  const showModal = useMemoizedFn(() => {
    if (updatedId) {
      return;
    }
    setModalVisible(true);
  });
  const gotoDynamic = useMemoizedFn(() => {
    navigation.navigate('Dynamic', { mid, face, name, sign, follow: true });
    setLatest(mid, updatedId + '');
    setUpdatedId('');
  });
  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={showModal}
        onPress={gotoDynamic}>
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
      <Overlay
        isVisible={modalVisible}
        overlayStyle={{
          padding: 16,
          backgroundColor: 'white',
        }}
        onBackdropPress={hideModal}>
        <Button type="clear" onPress={markNew}>
          标记未读{'                   '}
        </Button>
      </Overlay>
    </View>
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
