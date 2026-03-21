import React from "react";
import { clsx } from "clsx";

import {
  Animated,
  Dimensions,
  Easing,
  I18nManager,
  LayoutChangeEvent,
  Modal,
  StatusBar,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";

export interface MenuProps {
  children?: React.ReactNode;
  anchor?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  onRequestClose?(): void;
  animationDuration?: number;
  testID?: string;
  visible?: boolean;
}

enum States {
  Hidden,
  Animating,
  Shown,
}

const EASING = Easing.bezier(0.4, 0, 0.2, 1);
const SCREEN_INDENT = 8;

export function Menu(props: MenuProps) {
  const {
    animationDuration = 300,
    testID,
    anchor,
    className,
    style,
    children,
    visible,
    onRequestClose,
  } = props;

  const containerRef = React.useRef<View | null>(null);

  const [menuState, setMenuState] = React.useState<States>(States.Hidden);

  const [top, setTop] = React.useState(0);
  const [left, setLeft] = React.useState(0);

  const [menuWidth, setMenuWidth] = React.useState(0);
  const [menuHeight, setMenuHeight] = React.useState(0);

  const [buttonWidth, setButtonWidth] = React.useState(0);
  const [buttonHeight, setButtonHeight] = React.useState(0);

  const [menuSizeAnimation, setMenuSizeAnimation] = React.useState(
    () => new Animated.ValueXY({ x: 0, y: 0 }),
  );
  const [opacityAnimation, setOpacityAnimation] = React.useState(() => new Animated.Value(0));

  // 处理显示
  const show = () => {
    containerRef.current?.measureInWindow((left, top, buttonWidth, buttonHeight) => {
      setButtonHeight(buttonHeight);
      setButtonWidth(buttonWidth);
      setLeft(left);
      setTop(top);
      setMenuState(States.Shown);
    });
  };

  // 处理隐藏
  const hide = () => {
    Animated.timing(opacityAnimation, {
      toValue: 0,
      duration: animationDuration,
      easing: EASING,
      useNativeDriver: false,
    }).start(() => {
      setMenuState(States.Hidden);
      setMenuSizeAnimation(new Animated.ValueXY({ x: 0, y: 0 }));
      setOpacityAnimation(new Animated.Value(0));
    });
  };

  // 监听visible变化
  React.useEffect(() => {
    if (visible) {
      show();
    } else {
      hide();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // 菜单布局回调
  const onMenuLayout = (e: LayoutChangeEvent) => {
    if (menuState === States.Animating) {
      return;
    }
    const { width, height } = e.nativeEvent.layout;
    setMenuState(States.Animating);
    setMenuWidth(width);
    setMenuHeight(height);

    Animated.parallel([
      Animated.timing(menuSizeAnimation, {
        toValue: { x: width, y: height },
        duration: animationDuration,
        easing: EASING,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: animationDuration,
        easing: EASING,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // 关闭请求
  const handleRequestClose = () => {
    onRequestClose?.();
  };

  const { isRTL } = I18nManager;
  const dimensions = Dimensions.get("window");
  const { width: windowWidth } = dimensions;
  const windowHeight = dimensions.height - (StatusBar.currentHeight || 0);

  const menuSize = {
    width: menuSizeAnimation.x,
    height: menuSizeAnimation.y,
  };

  // 计算菜单位置
  let computedLeft = left;
  let computedTop = top;
  const transforms: any[] = [];

  if (
    (isRTL && computedLeft + buttonWidth - menuWidth > SCREEN_INDENT) ||
    (!isRTL && computedLeft + menuWidth > windowWidth - SCREEN_INDENT)
  ) {
    transforms.push({
      translateX: Animated.multiply(menuSizeAnimation.x, -1),
    });

    computedLeft = Math.min(windowWidth - SCREEN_INDENT, computedLeft + buttonWidth);
  } else if (computedLeft < SCREEN_INDENT) {
    computedLeft = SCREEN_INDENT;
  }

  // Y轴翻转
  if (computedTop > windowHeight - menuHeight - SCREEN_INDENT) {
    transforms.push({
      translateY: Animated.multiply(menuSizeAnimation.y, -1),
    });

    computedTop = windowHeight - SCREEN_INDENT;
    computedTop = Math.min(windowHeight - SCREEN_INDENT, computedTop + buttonHeight);
  } else if (computedTop < SCREEN_INDENT) {
    computedTop = SCREEN_INDENT;
  }

  const shadowMenuContainerStyle = {
    opacity: opacityAnimation,
    transform: transforms,
    top: computedTop,
    ...(isRTL ? { right: computedLeft } : { left: computedLeft }),
  };

  const animationStarted = menuState === States.Animating;
  const modalVisible = menuState === States.Shown || animationStarted;

  return (
    <View ref={containerRef} collapsable={false} testID={testID}>
      {anchor}

      <Modal
        visible={modalVisible}
        onRequestClose={handleRequestClose}
        supportedOrientations={[
          "portrait",
          "portrait-upside-down",
          "landscape",
          "landscape-left",
          "landscape-right",
        ]}
        transparent
      >
        <TouchableWithoutFeedback onPress={handleRequestClose} accessible={false}>
          <View className="absolute bottom-0 left-0 right-0 top-0">
            <Animated.View
              onLayout={onMenuLayout}
              className={clsx("absolute rounded bg-white shadow-lg shadow-black", className)}
              style={[shadowMenuContainerStyle, style]}
            >
              <Animated.View className="overflow-hidden" style={animationStarted && menuSize}>
                {children}
              </Animated.View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
