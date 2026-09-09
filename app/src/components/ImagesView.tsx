import { Image } from "@/components/styled/expo";
import { Icon, Text } from "@/components/styled/rneui";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureViewer, useGestureViewerState } from "react-native-gesture-image-viewer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showToast } from "@/utils";

import { useStore } from "../store";
import { saveImageToLibrary } from "./image-viewer-download";
import type { ImageViewerItem } from "./image-viewer.types";
import { normalizeImages } from "./image-viewer-images";
import { getOriginalImageButtonLabel, updateOriginalImageStatuses } from "./image-viewer-state";

const ViewerId = "images-viewer";
const LoadingPlaceholder = require("../../assets/loading2.gif");

function ImagesView() {
  const { imagesList, currentImageIndex, setImagesList, setCurrentImageIndex } = useStore();
  const { currentIndex, totalCount } = useGestureViewerState(ViewerId);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [originalImageStatuses, dispatchOriginalImageStatus] = React.useReducer(
    updateOriginalImageStatuses,
    {},
  );
  const [downloadStatus, setDownloadStatus] = React.useState<"idle" | "downloading">("idle");

  const images = normalizeImages(imagesList, windowWidth, windowHeight);
  const visible = images.length > 0;
  const viewerStateReady = totalCount > 0 && totalCount === images.length;
  const activeIndex = viewerStateReady ? currentIndex : currentImageIndex;
  const safeActiveIndex =
    images.length > 0 ? Math.min(Math.max(activeIndex, 0), images.length - 1) : 0;
  const activeTotal = images.length;
  const viewerKey = `${currentImageIndex}:${images.map((image) => image.uri).join("|")}`;
  const galleryKey = images.map((image) => image.originalUri).join("|");
  const activeImage = images[safeActiveIndex] ?? images[0];
  const activeOriginalStatus = activeImage
    ? (originalImageStatuses[activeImage.originalUri] ?? "idle")
    : "idle";
  const activeImageIsOriginal = activeImage?.uri === activeImage?.originalUri;
  const originalButtonLabel = getOriginalImageButtonLabel(
    activeOriginalStatus,
    Boolean(activeImageIsOriginal),
  );
  const originalButtonDisabled =
    !activeImage || activeImageIsOriginal || activeOriginalStatus !== "idle";
  const downloadButtonDisabled = !activeImage || downloadStatus === "downloading";

  React.useEffect(() => {
    dispatchOriginalImageStatus({ type: "reset" });
    setDownloadStatus("idle");
  }, [galleryKey]);

  const closeViewer = () => {
    dispatchOriginalImageStatus({ type: "reset" });
    setDownloadStatus("idle");
    setImagesList([]);
    setCurrentImageIndex(0);
  };

  const ensureWritePermission = async () => {
    const { requestPermissionsAsync } = await import("expo-media-library");
    const permission = await requestPermissionsAsync(true, ["photo"]);
    return permission.status === "granted";
  };

  const handleDownloadCurrentImage = async () => {
    if (downloadButtonDisabled || !activeImage) {
      return;
    }

    if (Platform.OS === "web") {
      void Linking.openURL(activeImage.originalUri);
      return;
    }

    setDownloadStatus("downloading");
    const result = await saveImageToLibrary(activeImage.originalUri, ensureWritePermission);
    setDownloadStatus("idle");

    if (result === "saved") {
      showToast("已保存到相册");
      return;
    }
    if (result === "permission-denied") {
      Alert.alert("需要相册权限", "请在系统设置中允许 MiniBili 保存图片到相册。", [
        { text: "取消", style: "cancel" },
        {
          text: "去设置",
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ]);
      return;
    }
    showToast("下载失败，请稍后重试");
  };

  const openOriginalImage = () => {
    if (originalButtonDisabled || !activeImage) {
      return;
    }

    dispatchOriginalImageStatus({ type: "request", uri: activeImage.originalUri });
  };

  const handleOriginalImageLoad = (image: ImageViewerItem) => {
    if (originalImageStatuses[image.originalUri] !== "loading") {
      return;
    }
    dispatchOriginalImageStatus({ type: "loaded", uri: image.originalUri });
  };

  const handleOriginalImageError = (image: ImageViewerItem) => {
    if (originalImageStatuses[image.originalUri] !== "loading") {
      return;
    }
    dispatchOriginalImageStatus({ type: "failed", uri: image.originalUri });
    showToast("原图加载失败，请稍后重试");
  };

  const renderContainer = (children: React.ReactElement, _helpers: { dismiss: () => void }) => {
    return (
      <View style={styles.container}>
        {children}
        <View pointerEvents="box-none" style={styles.overlay}>
          <View
            pointerEvents="box-none"
            style={[styles.bottomBarWrap, { bottom: Math.max(28, insets.bottom + 12) }]}
          >
            <View style={styles.bottomBar}>
              <Pressable
                accessibilityLabel={originalButtonLabel}
                accessibilityRole="button"
                accessibilityState={{ disabled: originalButtonDisabled }}
                disabled={originalButtonDisabled}
                hitSlop={12}
                onPress={openOriginalImage}
                style={[styles.originalButton, originalButtonDisabled && styles.disabledButton]}
              >
                {activeOriginalStatus === "loading" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Icon color="#fff" name="image-search" size={20} type="material" />
                )}
                <Text style={styles.originalButtonText}>{originalButtonLabel}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="下载图片"
                accessibilityRole="button"
                accessibilityState={{ disabled: downloadButtonDisabled }}
                disabled={downloadButtonDisabled}
                hitSlop={12}
                onPress={() => {
                  void handleDownloadCurrentImage();
                }}
                style={[styles.originalButton, downloadButtonDisabled && styles.disabledButton]}
              >
                {downloadStatus === "downloading" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Icon color="#fff" name="download" size={20} type="material" />
                )}
                <Text style={styles.originalButtonText}>下载</Text>
              </Pressable>
              <Text style={styles.counterText}>{`${safeActiveIndex + 1} / ${activeTotal}`}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={closeViewer}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      {visible ? (
        <GestureViewer
          backdropStyle={styles.backdrop}
          key={viewerKey}
          data={images}
          dismiss={{ enabled: true }}
          id={ViewerId}
          initialIndex={currentImageIndex}
          ListComponent={FlatList}
          maxZoomScale={4}
          onDismiss={closeViewer}
          renderContainer={renderContainer}
          renderItem={(item) => {
            const originalStatus = originalImageStatuses[item.originalUri] ?? "idle";
            const showOriginal = originalStatus === "loading" || originalStatus === "loaded";
            const sourceUri = showOriginal ? item.originalUri : item.uri;

            return (
              <Image
                contentFit="contain"
                onError={() => handleOriginalImageError(item)}
                onLoad={() => handleOriginalImageLoad(item)}
                placeholder={showOriginal ? { uri: item.uri } : LoadingPlaceholder}
                recyclingKey={`${item.originalUri}:${sourceUri}`}
                source={{ uri: sourceUri }}
                style={styles.image}
              />
            );
          }}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.88)",
  },
  bottomBar: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 22,
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bottomBarWrap: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  container: {
    flex: 1,
  },
  counterText: {
    color: "#fff",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  originalButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  originalButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});

export default ImagesView;
