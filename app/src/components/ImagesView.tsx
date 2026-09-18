import { Image } from "@/components/styled/expo";
import { Icon, Text } from "@/components/styled/rneui";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureViewer, useGestureViewerState } from "react-native-gesture-image-viewer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showToast } from "@/utils";

import { useSaveImage } from "../hooks/useSaveImage";
import { useStore } from "../store";
import type { ImageViewerItem } from "./image-viewer.types";
import { normalizeImages } from "./image-viewer-images";
import { getOriginalImageButtonLabel, updateOriginalImageStatuses } from "./image-viewer-state";

const ViewerId = "images-viewer";
const LoadingPlaceholder = require("../../assets/loading.gif");

function ImagesView() {
  const { imagesList, currentImageIndex, setImagesList, setCurrentImageIndex } = useStore();
  const { currentIndex, totalCount } = useGestureViewerState(ViewerId);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [originalImageStatuses, dispatchOriginalImageStatus] = React.useReducer(
    updateOriginalImageStatuses,
    {},
  );
  const { saving, saveImage } = useSaveImage();

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
  const downloadButtonDisabled = !activeImage || saving;

  React.useEffect(() => {
    dispatchOriginalImageStatus({ type: "reset" });
  }, [galleryKey]);

  const closeViewer = () => {
    dispatchOriginalImageStatus({ type: "reset" });
    setImagesList([]);
    setCurrentImageIndex(0);
  };

  const handleDownloadCurrentImage = () => {
    if (downloadButtonDisabled || !activeImage) {
      return;
    }

    void saveImage(activeImage.originalUri);
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
            style={[styles.topBarWrap, { top: Math.max(12, insets.top + 8) }]}
          >
            <Pressable
              accessibilityLabel="关闭"
              accessibilityRole="button"
              hitSlop={12}
              onPress={closeViewer}
              style={styles.closeButton}
            >
              <Icon color="#fff" name="close" size={24} type="material" />
            </Pressable>
          </View>
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
                onPress={handleDownloadCurrentImage}
                style={[styles.originalButton, downloadButtonDisabled && styles.disabledButton]}
              >
                {saving ? (
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
  closeButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
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
  topBarWrap: {
    position: "absolute",
    right: 16,
  },
});

export default ImagesView;
