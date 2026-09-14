import { useBackHandler } from '@react-native-community/hooks';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '@/components/styled/rneui';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, View } from 'react-native';

import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions';

import { useVideoInfo } from '../../api/video-info';
import CommentList from '../../components/CommentList';
import type { RootStackParamList } from '../../types';
import { showToast } from '../../utils';
import { PlayHeaderRight, PlayHeaderTitle } from './Header';
import NativePlayer from './native/NativePlayer';
import Player from './Player';
import { PLAYER_MODE } from './player-mode';
import VideoInfo from './VideoInfo';

// https://www.bilibili.com/blackboard/webplayer/mbplayer.html?aid=1501398719&bvid=BV1HS421w7wG&cid=1458260037&p=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?&bvid=BV1aX4y1B7n7&cid=1103612055&wmode=transparent&as_wide=1&crossDomain=1&lite=0&danmaku=0
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>;

function Play({ route }: Props) {
  const { bvid } = route.params;

  const { data, error } = useVideoInfo(bvid);
  const videoInfo = {
    ...route.params,
    ...data,
  };
  const [currentPage, setCurrentPage] = React.useState(1);
  const cid2 = videoInfo.pages ? videoInfo.pages[currentPage - 1].cid : 0;

  const errorShowedRef = React.useRef(false);

  React.useEffect(() => {
    if (!errorShowedRef.current && error) {
      errorShowedRef.current = true;
      Alert.alert('抱歉，出错了', '\n获取当前视频信息失败，无法播放\n可能是由于UP删除、设为私密或者涉及违规等');
    }
  }, [error]);

  const [fullscreen, setFullscreen] = React.useState(false);

  const isFocused = useIsFocused();
  // 全屏时返回键先退出全屏，而不是直接退出播放页
  useBackHandler(() => {
    if (fullscreen && isFocused) {
      setFullscreen(false);
      return true;
    }
    return false;
  });

  useUpdateNavigationOptions({
    headerTitle: () => <PlayHeaderTitle />,
    headerShown: !fullscreen,
    headerRight: () => <PlayHeaderRight cid={cid2} />,
  });

  const handlePlayEnd = () => {
    if (videoInfo.pages && currentPage < videoInfo.pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar hidden={fullscreen} style="auto" />
      {PLAYER_MODE === 'web' ? (
        <Player currentPage={currentPage} onPlayEnded={handlePlayEnd} />
      ) : (
        <NativePlayer
          currentPage={currentPage}
          onPlayEnded={handlePlayEnd}
          fullscreen={fullscreen}
          onFullscreenChange={setFullscreen}
        />
      )}
      <CommentList
        commentId={videoInfo?.aid || ''}
        commentType={1}
        sourceUrl={`https://www.bilibili.com/video/${bvid}/`}
        dividerRight={
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 dark:text-gray-400">{videoInfo?.tag}</Text>
          </View>
        }
      >
        <VideoInfo currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </CommentList>
    </View>
  );
}

export default Play;
