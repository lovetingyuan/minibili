import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ToastAndroid,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getVideoComments, getVideoInfo, TracyId } from '../services/Bilibili';
import { Avatar, Icon } from '@rneui/base';
// import { useFocusEffect } from '@react-navigation/native';
import useNetStatusToast from '../hooks/useNetStatusToast';
import handleShare from '../services/Share';
import { useKeepAwake } from 'expo-keep-awake';

// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
function __hack() {
  const timer = setInterval(() => {
    const player = document.querySelector('.mplayer-load-layer');
    if (player) {
      (player as HTMLDivElement).click();
      clearInterval(timer);
    }
  }, 200);
  // const timer2 = setInterval(() => {
  //   const jump = document.querySelector('.mplayer-toast-jump');
  //   const video = document.querySelector('video');
  //   if (jump && video) {
  //     const playProgress = video.currentTime / video.duration;
  //     if (playProgress < 0.5) {
  //       (jump as HTMLSpanElement).click();
  //       clearInterval(timer2);
  //     }
  //   }
  // }, 200);
  setTimeout(() => {
    clearInterval(timer);
    // clearInterval(timer2);
  }, 5000);
}
const INJECTED_JAVASCRIPT = `(${__hack.toString()})();`;
const Loading = () => {
  return (
    <View style={styles.loadingView}>
      <Image
        style={styles.loadingImage}
        resizeMode="contain"
        source={require('../assets/video-loading.png')}
      />
    </View>
  );
};
const parseDate = (time?: number) => {
  if (!time) {
    return '-';
  }
  const date = new Date(time * 1000);
  return date.getMonth() + 1 + '-' + date.getDate();
};

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GetFuncPromiseType, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>;

const handleMessage = (msg: string) => {
  let normalStr = '';
  let emojiStr = '';
  const result = [];
  let isEmoji = false;
  let i = 0;
  for (let c of msg) {
    i++;
    if (c === '[') {
      result.push(normalStr);
      normalStr = '';
      isEmoji = true;
    } else if (c === ']') {
      isEmoji = false;
      result.push(
        <Text key={emojiStr + i} style={styles.emojiText}>
          {' '}
          {emojiStr}
        </Text>,
      );
      emojiStr = '';
    } else {
      if (isEmoji) {
        emojiStr += c;
      } else {
        normalStr += c;
      }
    }
  }
  if (normalStr) {
    result.push(normalStr);
  }
  return result;
};

export default ({ route }: Props) => {
  __DEV__ && console.log(route.name);
  const { aid, bvid, name, mid } = route.params;
  type Comments = GetFuncPromiseType<typeof getVideoComments>;
  type VideoInfo = GetFuncPromiseType<typeof getVideoInfo>;
  const [comments, setComments] = React.useState<Comments>([]);
  const [videoInfo, setVideoInfo] = React.useState<VideoInfo | null>(null);
  const webviewRef = React.useRef<null | WebView>(null);
  const { width, height } = useWindowDimensions();
  const [videoHeight, setVideoHeight] = React.useState(height * 0.4);
  // const [showWebView, setShowWebView] = React.useState(true);
  useKeepAwake();
  const connectType = useNetStatusToast(bvid);
  const tracyStyle =
    mid === TracyId
      ? {
          color: 'rgb(251, 114, 153)',
        }
      : null;
  React.useEffect(() => {
    getVideoComments(aid).then(replies => {
      setComments(replies);
    });
    getVideoInfo(aid).then(vi => {
      setVideoInfo(vi);
      if (vi.width >= vi.height) {
        setVideoHeight((vi.height / vi.width) * width + 80);
      } else {
        setVideoHeight(height * 0.4);
      }
    });
  }, [bvid, aid, width, height]);

  const isUpStyle = (uname: string) => {
    if (uname === name) {
      return {
        color: '#FF6699',
      };
    }
  };
  const search = new URLSearchParams();
  Object.entries({
    aid,
    bvid,
    autoplay: 1,
    highQuality: connectType === 'wifi' ? 1 : 0,
    quality: connectType === 'wifi' ? 20 : 16,
    portraitFullScreen: true,
    hasMuteButton: true,
  }).forEach(([k, v]) => {
    search.append(k, v + '');
  });
  const onShare = useCallback(() => {
    if (videoInfo) {
      handleShare(name, videoInfo.title, bvid);
    }
  }, [name, videoInfo, bvid]);
  return (
    <View style={{ flex: 1 }}>
      <View
        renderToHardwareTextureAndroid
        style={[styles.playerContainer, { height: videoHeight }]}>
        <WebView
          source={{
            uri: `https://player.bilibili.com/player.html?${search}`,
          }}
          originWhitelist={['https://*', 'bilibili://*']}
          allowsFullscreenVideo
          injectedJavaScriptForMainFrameOnly
          allowsInlineMediaPlayback
          startInLoadingState
          mediaPlaybackRequiresUserAction={false}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          renderLoading={Loading}
          ref={webviewRef}
          onError={() => {
            ToastAndroid.show('加载失败', ToastAndroid.SHORT);
            webviewRef && webviewRef.current?.reload();
          }}
          onShouldStartLoadWithRequest={request => {
            // Only allow navigating within this website
            if (
              request.url.startsWith('http') &&
              !request.url.includes('.apk')
            ) {
              return true;
            }
            return false;
          }}
        />
      </View>
      <ScrollView style={styles.videoInfoContainer}>
        <View style={styles.videoHeader}>
          <View style={styles.upInfoContainer}>
            {videoInfo?.upFace ? (
              <Avatar size={35} rounded source={{ uri: videoInfo.upFace }} />
            ) : null}
            <Text style={[styles.upName, tracyStyle]}>
              {videoInfo?.upName || '-'}
            </Text>
          </View>
          <View style={styles.videoInfo}>
            <Icon name="update" color="#999" size={14} />
            <Text style={styles.videoInfoText}>
              {' '}
              {parseDate(videoInfo?.pubTime)}
            </Text>
            <Text>{'   '}</Text>
            <Image
              style={styles.icon}
              source={require('../assets/play-mark.png')}
            />
            <Text style={styles.videoInfoText}>
              {' '}
              {videoInfo ? (videoInfo?.viewNum / 10000).toFixed(1) + '万' : ''}
            </Text>
            <Pressable onPress={onShare}>
              <Image
                style={styles.shareIcon}
                source={require('../assets/share.png')}
              />
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={styles.videoTitle}>{videoInfo?.title || ''}</Text>
          {videoInfo?.desc && videoInfo.desc.trim() !== '-' ? (
            <Text style={styles.videoDesc}>{videoInfo.desc}</Text>
          ) : null}
        </View>
        <View style={styles.repliesContainer} />
        {comments?.length ? (
          comments.map((comment, i) => {
            return (
              <View
                style={[styles.replyItem, i ? null : { paddingTop: 0 }]}
                key={comment.id}>
                <View style={styles.replyItemContent}>
                  <Text style={[styles.replyName, isUpStyle(comment.name)]}>
                    {comment.name}:{' '}
                  </Text>
                  <Text
                    style={[
                      styles.replyItem.message,
                      comment.top ? styles.topReply : null,
                    ]}
                    selectable
                    selectionColor={'#BFEDFA'}>
                    {handleMessage(comment.message)}
                  </Text>
                </View>
                {comment.replies ? (
                  <View style={styles.repliesreplies}>
                    {comment.replies.map(reply => {
                      return (
                        <View key={reply.id} style={styles.replyContainer}>
                          <Text
                            style={[
                              styles.replyItem.replyUpName,
                              isUpStyle(reply.name),
                            ]}>
                            {reply.name}:{' '}
                          </Text>
                          <Text
                            selectable
                            selectionColor={'#BFEDFA'}
                            textBreakStrategy="balanced"
                            style={styles.replyItem.replyMessage}>
                            {handleMessage(reply.message)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View>
            <Text style={styles.noCommentText}>暂无评论</Text>
          </View>
        )}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>只加载前20条</Text>
          <Text />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingView: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    alignItems: 'center',
  },
  loadingImage: {
    flex: 1,
    width: '80%',
  },
  playerContainer: { width: '100%', height: '40%' },
  videoInfoContainer: { paddingVertical: 20, paddingHorizontal: 16 },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  upName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoInfo: {
    flexDirection: 'row',
    flexShrink: 0,
    minWidth: 80,
    color: '#555',
    alignItems: 'center',
  },
  videoInfoText: { color: '#888' },
  videoTitle: { fontSize: 16, marginTop: 12 },
  videoDesc: { marginTop: 10 },
  repliesContainer: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    marginVertical: 24,
  },
  replyItem: {
    paddingBottom: 16,
    paddingTop: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',

    message: { fontSize: 16, lineHeight: 22, marginLeft: 2 },

    replyUpName: {
      fontWeight: 'bold',
      color: '#666',
    },
    replyMessage: { color: '#666' },
  },
  topReply: {
    color: '#00699D',
  },
  replyItemContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  replyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  replyContainer: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    paddingTop: 5,
  },
  icon: {
    width: 13,
    height: 11,
  },
  shareIcon: {
    width: 15,
    height: 15,
    marginLeft: 15,
  },
  footerContainer: { marginVertical: 10, alignItems: 'center' },
  footerText: { color: '#aaa', fontSize: 12 },
  noCommentText: {
    textAlign: 'center',
    marginVertical: 50,
  },
  emojiText: {
    fontSize: 12,
    color: '#0EB350',
  },
  repliesreplies: {
    marginTop: 5,
    borderLeftColor: '#ddd',
    borderLeftWidth: 1,
    marginLeft: 6,
    paddingLeft: 6,
  },
});
