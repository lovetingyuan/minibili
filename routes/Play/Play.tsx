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
import { getVideoComments, getVideoInfo } from '../../services/Bilibili';
import { Avatar, ButtonGroup, Icon } from '@rneui/base';
// import useNetStatusToast from '../../hooks/useNetStatusToast';
import { handleShareVideo } from '../../services/Share';
import * as KeepAwake from 'expo-keep-awake';
import Comment from '../../components/Comment';
import * as Clipboard from 'expo-clipboard';

// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?danmaku=1&highQuality=0&bvid=BV1cB4y1n7v8
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1BN4y1G7tx&page=1&posterFirst=1
function __hack() {
  const timer = setInterval(() => {
    const player = document.querySelector<HTMLDivElement>(
      '.mplayer-load-layer',
    );
    if (player && player.style.display !== 'none') {
      (player as HTMLDivElement).click();
      document.querySelector('video')?.play();
      clearInterval(timer);
    }
  }, 200);

  const timer2 = setInterval(() => {
    const dom = document.querySelector<HTMLDivElement>('.mplayer-display');
    if (dom) {
      clearInterval(timer2);
      dom.ondblclick = () => {
        const video = document.querySelector('video');
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      };
    }
  }, 200);
  const postPlayState = (state: string) => {
    ((window as any).ReactNativeWebView as WebView).postMessage(
      JSON.stringify({
        action: 'playState',
        payload: state,
      }),
    );
  };
  const timer3 = setInterval(() => {
    const video = document.querySelector('video');
    if (video) {
      clearInterval(timer3);
      const handleVideoSize = () => {
        const { videoWidth, videoHeight } = video;
        const right = document.querySelector('.mplayer-right');
        if (
          videoWidth < videoHeight &&
          right &&
          !document.getElementById('arrow-btn')
        ) {
          const arrowBtn = document.createElement('div');
          arrowBtn.innerHTML = '&dArr;';
          arrowBtn.id = 'arrow-btn';
          arrowBtn.dataset.direction = 'down';
          arrowBtn.style.cssText = `
          width: 36px;
          height: 36px;
          color: white;
          text-align: center;
          font-size: 30px;
          transform: scale(1.2, 1);
          `;
          arrowBtn.addEventListener('click', () => {
            const direction = arrowBtn.dataset.direction;
            if (direction === 'up') {
              arrowBtn.dataset.direction = 'down';
              arrowBtn.innerHTML = '&dArr;';
            } else {
              arrowBtn.dataset.direction = 'up';
              arrowBtn.innerHTML = '&uArr;';
            }
            ((window as any).ReactNativeWebView as WebView).postMessage(
              JSON.stringify({
                action: 'change-video-height',
                payload: direction,
              }),
            );
          });
          right.appendChild(arrowBtn);
        }
      };
      video.addEventListener('play', () => {
        postPlayState('play');
      });
      Array('ended', 'pause', 'waiting').forEach(evt => {
        video.addEventListener(evt, () => {
          postPlayState(evt);
        });
      });
      postPlayState(video.paused ? 'pause' : 'play');
      if (video.videoWidth) {
        handleVideoSize();
      }
      video.addEventListener('canplay', handleVideoSize);
      video.addEventListener('ended', () => {
        const arrowBtn = document.getElementById('arrow-btn');
        if (arrowBtn) {
          arrowBtn.dataset.direction = 'down';
          arrowBtn.innerHTML = '&dArr;';
        }
        ((window as any).ReactNativeWebView as WebView).postMessage(
          JSON.stringify({
            action: 'change-video-height',
            payload: 'up',
          }),
        );
      });
    }
  }, 200);
  const timer4 = setInterval(() => {
    const right = document.querySelector('.mplayer-right');
    if (!right) {
      return;
    }
    clearInterval(timer4);
    const reloadBtn = document.createElement('div');
    reloadBtn.innerHTML = '&orarr;';
    reloadBtn.style.cssText = `
    width: 36px;
    height: 36px;
    color: white;
    font-size: 28px;
    text-align: center;
    transform: rotate(90deg);
    `;
    reloadBtn.addEventListener('click', () => {
      location.reload();
    });
    right.appendChild(reloadBtn);
  }, 100);
  const timer5 = setInterval(() => {
    const poster =
      document.querySelector<HTMLImageElement>('img.mplayer-poster');
    if (poster && !poster.dataset.patched) {
      poster.dataset.patched = 'true';
      const image = poster.src;
      // @ts-ignore
      poster.style.backdropFilter = 'blur(12px)';
      poster.style.objectFit = 'contain';
      if (poster.parentElement) {
        poster.parentElement.style.backgroundImage = `url("${image}")`;
      }
    }
  }, 100);
  setInterval(() => {
    const sss = Array.from(
      document.querySelectorAll<any>('.mplayer-toast.mplayer-show'),
    );
    if (sss.length) {
      const failed = sss.findIndex(
        s =>
          s.querySelector('.mplayer-toast-text')?.innerText.trim() ===
          '播放失败',
      );
      if (failed !== -1) {
        const jump = sss[failed].querySelector('.mplayer-toast-jump');
        if (jump.innerText.trim() === '') {
          jump.innerHTML = '✕';
          jump.addEventListener('click', (e: any) => {
            e.preventDefault();
            jump.parentElement!.classList.remove('mplayer-show');
          });
        }
      }
    }
  }, 1000);
  setTimeout(() => {
    clearInterval(timer);
    clearInterval(timer2);
    clearInterval(timer3);
    clearInterval(timer4);
    clearInterval(timer5);
  }, 4000);
}
const INJECTED_JAVASCRIPT = `(${__hack.toString()})();`;
const Loading = (cover?: string) => {
  return (
    <View style={styles.loadingView}>
      <Image
        style={{
          flex: 1,
          width: cover ? '100%' : '80%',
        }}
        resizeMode="cover"
        source={
          cover ? { uri: cover } : require('../../assets/video-loading.png')
        }
      />
    </View>
  );
};
const parseDate = (time?: number) => {
  if (!time) {
    return '-';
  }
  const date = new Date(time * 1000);
  const year = new Date().getFullYear();
  return (
    (year !== date.getFullYear() ? date.getFullYear() + '-' : '') +
    (date.getMonth() + 1) +
    '-' +
    date.getDate()
  );
};
import { useNetInfo } from '@react-native-community/netinfo';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GetFuncPromiseType, RootStackParamList } from '../../types';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import store from '../../valtio/store';
import { useSnapshot } from 'valtio';

import { debounce } from 'throttle-debounce';

const netTip = debounce(
  1000,
  () => {
    ToastAndroid.showWithGravity(
      ' 请注意当前网络不是 wifi ',
      ToastAndroid.LONG,
      ToastAndroid.CENTER,
    );
  },
  {
    atBegin: true,
  },
);

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>;

export default ({ route, navigation }: Props) => {
  __DEV__ && console.log(route.name);
  const { aid, bvid, name, mid } = route.params;
  type Comments = GetFuncPromiseType<typeof getVideoComments>;
  type VideoInfo = GetFuncPromiseType<typeof getVideoInfo>;
  const [comments, setComments] = React.useState<Comments>([]);
  const [videoInfo, setVideoInfo] = React.useState<VideoInfo | null>(null);
  const webviewRef = React.useRef<null | WebView>(null);
  const { width, height } = useWindowDimensions();
  const [videoViewHeight, setVideoViewHeight] = React.useState(height * 0.4);
  const [currentPage, setCurrentPage] = React.useState(0);

  const { type: connectType } = useNetInfo();
  if (connectType !== 'wifi' && connectType !== 'unknown') {
    netTip();
  }

  const { specialUser } = useSnapshot(store);
  const tracyStyle =
    mid == specialUser?.mid
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
    });
  }, [bvid, aid]);

  const [verticalScale, setVerticalScale] = React.useState(0.4);
  const [extraHeight, setExtraHeight] = React.useState(0);

  React.useEffect(() => {
    const vi = videoInfo;
    if (!vi) {
      return;
    }
    const [videoWidth, videoHeight] =
      currentPage > 0
        ? [vi.pages[currentPage].width, vi.pages[currentPage].height]
        : [vi.width, vi.height];
    if (videoWidth >= videoHeight) {
      setVideoViewHeight((videoHeight / videoWidth) * width + extraHeight);
    } else {
      setVideoViewHeight(height * verticalScale);
    }
  }, [videoInfo, width, height, currentPage, verticalScale, extraHeight]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      store.watchedVideos[bvid] = true;
    }, 8000);
    return () => {
      clearTimeout(timer);
    };
  }, [bvid]);

  const search = new URLSearchParams();
  const playUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html';
  Object.entries({
    // aid,
    bvid,
    autoplay: 1,
    highQuality: connectType === 'wifi' ? 1 : 0,
    quality: connectType === 'wifi' ? 100 : 16,
    portraitFullScreen: true,
    // hasMuteButton: true,
    page: currentPage + 1,
  }).forEach(([k, v]) => {
    search.append(k, v + '');
  });
  // const playUrl = 'https://www.bilibili.com/blackboard/newplayer.html';
  // Object.entries({
  //   crossDomain: true,
  //   as_wide: 1,
  //   page: 1,
  //   bvid,
  //   poster: 1,
  //   autoplay: 1,
  //   highQuality: 1,
  // }).forEach(([k, v]) => {
  //   search.append(k, v + '');
  // });

  // const playUrl = 'https://www.bilibili.com/blackboard/html5mobileplayer.html';
  // Object.entries({
  //   danmaku: 1,
  //   highQuality: 1,
  //   bvid,
  // }).forEach(([k, v]) => {
  //   search.append(k, v + '');
  // });
  const onShare = useCallback(() => {
    if (videoInfo) {
      handleShareVideo(name, videoInfo.title, bvid);
    }
  }, [name, videoInfo, bvid]);
  const isFocused = useIsFocused();
  useFocusEffect(() => {
    if (!isFocused) {
      KeepAwake.deactivateKeepAwake('PLAY');
    }
  });
  let videoDesc = videoInfo?.desc;
  if (videoDesc === '-') {
    videoDesc = '';
  } else if (
    videoDesc &&
    videoInfo?.videosNum === 1 &&
    videoDesc === videoInfo.title
  ) {
    videoDesc = '';
  }
  // console.log(99999, videoInfo);
  // const slices = [];
  // if (videoInfo) {
  //   if (videoInfo.pages.length !== videoInfo.videos) {

  //   }
  // }
  return (
    <View style={{ flex: 1 }}>
      <View
        renderToHardwareTextureAndroid
        style={[styles.playerContainer, { height: videoViewHeight }]}>
        <WebView
          source={{
            uri: `${playUrl}?${search}`,
          }}
          originWhitelist={['https://*', 'bilibili://*']}
          allowsFullscreenVideo
          injectedJavaScriptForMainFrameOnly
          allowsInlineMediaPlayback
          startInLoadingState
          mediaPlaybackRequiresUserAction={false}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          renderLoading={() => Loading(videoInfo?.cover)}
          ref={webviewRef}
          onMessage={evt => {
            try {
              const data = JSON.parse(evt.nativeEvent.data);
              if (data.action === 'playState') {
                if (data.payload === 'play') {
                  KeepAwake.activateKeepAwake('PLAY');
                  setExtraHeight(80);
                } else {
                  KeepAwake.deactivateKeepAwake('PLAY');
                  if (data.payload === 'ended') {
                    setExtraHeight(0);
                  }
                }
              }
              if (data.action === 'change-video-height') {
                setVerticalScale(data.payload === 'up' ? 0.4 : 0.7);
              }
              if (data.action === 'console.log') {
                __DEV__ && console.log('message', data.payload);
              }
            } catch (e) {}
          }}
          onError={() => {
            ToastAndroid.show('加载失败', ToastAndroid.SHORT);
            webviewRef && webviewRef.current?.reload();
          }}
          onShouldStartLoadWithRequest={request => {
            // Only allow navigating within this website
            if (request.url.endsWith('/log-reporter.js')) {
              return false;
            }
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
          <Pressable
            onPress={() => {
              store.dynamicUser = {
                mid,
                face: videoInfo?.upFace || '',
                name,
                sign: '-',
              };
              // setTimeout(() => {
              navigation.navigate('Dynamic');
              // }, 200);
            }}>
            <View style={styles.upInfoContainer}>
              {videoInfo?.upFace ? (
                <Avatar
                  size={35}
                  rounded
                  source={{ uri: videoInfo.upFace + '@80w_80h_1c.webp' }}
                />
              ) : null}
              <Text style={[styles.upName, tracyStyle]}>
                {videoInfo?.upName || '-'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.videoInfo}>
            <Icon name="update" color="#999" size={14} />
            <Text style={styles.videoInfoText}>
              {' '}
              {parseDate(videoInfo?.pubTime)}
            </Text>
            <Text>{'   '}</Text>
            <Image
              style={styles.icon}
              source={require('../../assets/play-mark.png')}
            />
            <Text style={styles.videoInfoText}>
              {' '}
              {videoInfo ? (videoInfo?.viewNum / 10000).toFixed(1) + '万' : ''}
            </Text>
            <Pressable onPress={onShare}>
              <Image
                style={styles.shareIcon}
                source={require('../../assets/share.png')}
              />
            </Pressable>
          </View>
        </View>
        <View>
          <Text style={styles.videoTitle}>
            {videoInfo?.title || videoInfo?.pages[0].title || '-'}
          </Text>
          {videoDesc ? <Text style={styles.videoDesc}>{videoDesc}</Text> : null}
          {
            (videoInfo?.videosNum || 0) > 1 ? (
              <ButtonGroup
                buttonStyle={{}}
                buttonContainerStyle={{
                  margin: 0,
                }}
                innerBorderStyle={{
                  width: 0.5,
                }}
                buttons={videoInfo?.pages.map((v, i) => `${i + 1}. ${v.title}`)}
                containerStyle={{
                  marginTop: 16,
                  marginLeft: 0,
                  marginRight: 0,
                  borderWidth: 0,
                }}
                onPress={setCurrentPage}
                selectedButtonStyle={{}}
                selectedIndex={currentPage}
                selectedTextStyle={{}}
                textStyle={{
                  fontSize: 14,
                }}
              />
            ) : videoInfo?.videos !== videoInfo?.videosNum ? (
              <Text>该视频为交互视频，暂不支持</Text>
            ) : null // <ScrollView
            //   horizontal
            //   showsHorizontalScrollIndicator
            //   style={styles.videoPages}>
            //   <ButtonGroup
            //     buttonStyle={{ width: 100 }}
            //     buttonContainerStyle={
            //       {
            //         // marginTop: 15,
            //       }
            //     }
            //     buttons={videoInfo?.pages.map(v => v.title)}
            //     containerStyle={{
            //       marginTop: 15,
            //       marginLeft: 0,
            //       marginRight: 0,
            //     }}
            //     innerBorderStyle={{}}
            //     onPress={i => setCurrentPage(i)}
            //     selectedButtonStyle={{
            //       borderWidth: 1,
            //       borderColor: 'blue',
            //     }}
            //     selectedIndex={currentPage}
            //     // selectedIndexes={selectedIndexes}
            //     selectedTextStyle={{}}
            //     textStyle={{
            //       fontSize: 14,
            //     }}
            //   />
            //   {/* {videoInfo?.pages.map((item, i) => {
            //     return (
            //       <Button
            //         key={item.cid}
            //         type="clear"
            //         onPress={() => {
            //           setCurrentPage(i);
            //         }}>
            //         {item.title}
            //       </Button>
            //     );
            //   })} */}
            // </ScrollView>
          }
        </View>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Pressable
            onPress={() => {
              Clipboard.setStringAsync(videoInfo?.bvid || '').then(() => {
                ToastAndroid.show('已复制', ToastAndroid.SHORT);
              });
            }}>
            <Text style={{ color: '#666', fontSize: 12 }}>
              {'  '}
              {videoInfo?.bvid}
              {' - '}
            </Text>
          </Pressable>
          <Text style={{ color: '#666', fontSize: 12 }}>
            {videoInfo?.tname}
          </Text>
        </View>
        {comments?.length ? (
          comments.map((comment, i) => {
            return (
              <View
                key={comment.id}
                style={[
                  styles.commentItemContainer,
                  i ? null : { marginTop: 0 },
                ]}>
                <Comment upName={name} comment={comment} />
              </View>
            );
          })
        ) : (
          <View>
            <Text style={styles.noCommentText}>暂无评论</Text>
          </View>
        )}
        {comments.length ? (
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>只加载前40条</Text>
            <Text />
          </View>
        ) : null}
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

  playerContainer: { width: '100%', height: '40%' },
  videoInfoContainer: { paddingVertical: 18, paddingHorizontal: 12 },
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
  videoPages: {
    // flex: 1,
  },
  divider: {
    flexDirection: 'row',
    marginVertical: 18,
    alignItems: 'center',
  },
  dividerLine: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    flexGrow: 1,
  },
  commentItemContainer: {
    marginTop: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 0.5,
  },
  replyItem: {
    paddingBottom: 16,
    paddingTop: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    // alignItems: 'center',
  },
  replyUpName: {
    fontWeight: 'bold',
    color: '#666',
  },
  replyMessage: { color: '#666', alignItems: 'center' },

  replyItemMessage: { fontSize: 16, lineHeight: 22 },
  topReply: {
    color: '#00699D',
    fontWeight: 'bold',
  },
  upLikeReply: {
    color: '#4f7d00',
    fontWeight: 'bold',
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
  replyReplyContainer: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    paddingTop: 5,
    // alignItems: 'flex-start',
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
    marginLeft: 4,
    paddingLeft: 4,
  },
});
