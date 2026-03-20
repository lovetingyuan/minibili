import { Icon, Slider, Text } from "@/components/styled/rneui";
import { clsx } from "clsx";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React from "react";
import { ImageBackground, TouchableOpacity, useColorScheme, View } from "react-native";

import { useAudioUrl } from "@/api/play-url";
import { UA } from "@/constants";
import { colors } from "@/constants/colors.tw";
import { useStore } from "@/store";
import { parseImgUrl, parseTime, showToast } from "@/utils";

void setAudioModeAsync({
  shouldPlayInBackground: true,
  playsInSilentMode: true,
  interruptionMode: "doNotMix",
});

const shadowStyle = {
  shadowColor: "black",
  shadowOpacity: 0.8,
  shadowOffset: { width: 0, height: -12 },
  shadowRadius: 10,
  elevation: 10, // 添加 Android 阴影效果
};

// const audioSoundCache = {}
function PlayerBar(props: { url?: string; time?: number; error?: boolean }) {
  const { playingSong, get$musicList, setPlayingSong } = useStore();
  const [playMode, setPlayMode] = React.useState<"single" | "order" | "loop">("single");
  let prevSong = null;
  let nextSong = null;
  if (playingSong) {
    const [{ songs }] = get$musicList();
    const index = songs.findIndex((s) => s.bvid === playingSong.bvid && s.cid === playingSong.cid);
    prevSong = songs[index - 1] ?? null;
    nextSong = songs[index + 1] ?? null;
  }
  const player = useAudioPlayer(
    props.url
      ? {
          uri: props.url,
          headers: {
            "user-agent": UA,
            referer: "https://www.bilibili.com",
          },
          name: playingSong?.name,
        }
      : null,
    {
      updateInterval: 1000,
    },
  );
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;
  const playFinished = status.didJustFinish;
  const playingTime = Math.floor(status.currentTime * 1000);

  React.useEffect(() => {
    if (!props.url) {
      return;
    }

    player.play();
  }, [player, props.url]);

  React.useEffect(() => {
    player.loop = playMode === "loop";
  }, [playMode, player]);

  React.useEffect(() => {
    if (!status.didJustFinish || playMode !== "order" || !nextSong) {
      return;
    }

    setPlayingSong(nextSong);
  }, [nextSong, playMode, setPlayingSong, status.didJustFinish]);

  React.useEffect(() => {
    if (!playingSong || !props.url) {
      return;
    }

    player.setActiveForLockScreen(true, {
      title: playingSong.name,
      artist: playingSong.singer,
      artworkUrl: parseImgUrl(playingSong.cover, 240, 240),
    });

    return () => {
      player.setActiveForLockScreen(false);
    };
  }, [player, playingSong, props.url]);

  const isDark = useColorScheme() === "dark";
  if (!playingSong) {
    return null;
  }

  return (
    <ImageBackground
      source={
        isDark ? require("../../../assets/bg-342.png") : require("../../../assets/bg-111.webp")
      }
      resizeMode="stretch"
      className={`px-4 py-6 ${colors.white.bg}`}
      style={shadowStyle}
    >
      <View className="flex-row gap-3">
        <ImageBackground
          source={
            playingSong
              ? { uri: parseImgUrl(playingSong.cover, 180, 180) }
              : require("../../../assets/loading.png")
          }
          resizeMode="cover"
          className="h-20 w-20 rounded"
        >
          <Icon
            name={isPlaying ? "pause-circle-outline" : "play-circle-outline"} // pause-circle-outline
            type="material-community"
            size={50}
            className="h-full items-center justify-center"
            onPress={() => {
              if (isPlaying) {
                player.pause();
              } else if (playFinished) {
                player
                  .seekTo(0)
                  .then(() => {
                    player.play();
                  })
                  .catch(() => {});
              } else {
                player.play();
              }
            }}
            color={"white"}
          />
        </ImageBackground>
        <View className="flex-1 justify-between">
          <View className="flex-row items-center justify-between">
            <Text
              className="flex-1 text-lg"
              ellipsizeMode="tail"
              onPress={() => {
                player.play();
              }}
              numberOfLines={1}
            >
              {playingSong?.name || "-"}
            </Text>
            <Text className={colors.gray5.text}>
              {playingSong?.singer ? playingSong.singer : ""}
            </Text>
          </View>
          <View className="flex-row gap-6">
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={!prevSong}
              onPress={() => {
                setPlayingSong(prevSong);
              }}
            >
              <Text className={clsx(prevSong ? colors.primary.text : "line-through opacity-60")}>
                上一首
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={!nextSong}
              onPress={() => {
                setPlayingSong(nextSong);
              }}
            >
              <Text className={clsx(nextSong ? colors.primary.text : "line-through opacity-60")}>
                下一首
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                const mode =
                  playMode === "single" ? "order" : playMode === "order" ? "loop" : "single";
                setPlayMode(mode);
              }}
            >
              <Text className={colors.primary.text}>
                {playMode === "single"
                  ? "单曲播放"
                  : playMode === "order"
                    ? "顺序播放"
                    : "循环单曲"}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs" style={{ fontVariant: ["tabular-nums"] }}>
              {parseTime(playingTime)}
            </Text>

            {props.url ? (
              <Slider
                className="h-2 flex-1"
                value={playingTime}
                onValueChange={(currentTime) => {
                  player.seekTo(currentTime / 1000).catch(() => {});
                }}
                maximumValue={props.time}
                minimumValue={0}
                step={1000}
                allowTouchTrack
                minimumTrackTintColorClassName={colors.secondary.accent}
                trackClassName="h-1 rounded"
                thumbClassName={clsx(colors.secondary.bg, "h-3 w-3 rounded-full")}
              />
            ) : null}
            <Text className="text-xs">{parseTime(props.time || 0)}</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

function MusicPlayerBar() {
  const { playingSong, setPlayingSong } = useStore();
  const { url, time, error } = useAudioUrl(playingSong?.bvid || "", playingSong?.cid);

  React.useEffect(() => {
    if (error) {
      showToast("抱歉，无法获取音乐");
    }
  }, [error]);

  React.useEffect(() => {
    return () => {
      setPlayingSong(null);
    };
  }, [setPlayingSong]);
  return <PlayerBar key={url} url={url} time={time} error={!!error} />;
}

export default MusicPlayerBar;
