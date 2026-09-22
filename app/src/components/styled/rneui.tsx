import React from "react";
import {
  Badge as BaseBadge,
  BottomSheet as BaseBottomSheet,
  Button as BaseButton,
  Card as BaseCard,
  Dialog as BaseDialog,
  ListItem as BaseListItem,
  Overlay as BaseOverlay,
  Skeleton as BaseSkeleton,
  ThemeProvider,
  createTheme,
} from "@rneui/themed";
import type {
  BadgeProps as BaseBadgeProps,
  BottomSheetProps as BaseBottomSheetProps,
  ButtonProps as BaseButtonProps,
  CardProps as BaseCardProps,
  DialogButtonProps as BaseDialogButtonProps,
  DialogProps as BaseDialogProps,
  DialogTitleProps as BaseDialogTitleProps,
  ListItemAccordionProps as BaseListItemAccordionProps,
  ListItemProps as BaseListItemProps,
  OverlayProps as BaseOverlayProps,
  SkeletonProps as BaseSkeletonProps,
  TextProps as BaseTextProps,
} from "@rneui/base";
import NativeCheckBox from "@react-native-community/checkbox";
import { FlashList as BaseFlashList } from "@shopify/flash-list";
import type { FlashListProps, FlashListRef } from "@shopify/flash-list";
import {
  Platform,
  Pressable,
  Switch as NativeSwitch,
  Text as NativeText,
  View,
} from "react-native";
import type {
  PressableProps,
  SwitchProps as NativeSwitchProps,
  TextProps as NativeTextProps,
  TextStyle,
} from "react-native";
import type { Edge } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

import { colors } from "@/constants/colors.tw";

function useResolvedStyle(className?: string) {
  return useResolveClassNames(className ?? "");
}

function useResolvedColor(className?: string) {
  const styles = useResolveClassNames(className ?? "");

  if (typeof styles.accentColor === "string") {
    return styles.accentColor;
  }
  if (typeof styles.color === "string") {
    return styles.color;
  }

  return undefined;
}

type BadgeProps = BaseBadgeProps & {
  badgeClassName?: string;
  containerClassName?: string;
  textClassName?: string;
};

export function Badge({
  badgeClassName,
  containerClassName,
  textClassName,
  badgeStyle,
  containerStyle,
  textStyle,
  ...props
}: BadgeProps) {
  const resolvedBadgeStyle = useResolvedStyle(badgeClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedTextStyle = useResolvedStyle(textClassName);

  return (
    <BaseBadge
      {...props}
      badgeStyle={[badgeStyle, resolvedBadgeStyle]}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      textStyle={[textStyle, resolvedTextStyle]}
    />
  );
}

type BottomSheetProps = BaseBottomSheetProps & {
  backdropClassName?: string;
  containerClassName?: string;
  /** 内部通过 SafeAreaView 包裹内容，默认四边都加安全区内边距，贴底场景可只保留 top */
  edges?: Edge[];
  children?: React.ReactNode;
};

export function BottomSheet({
  backdropClassName,
  containerClassName,
  backdropStyle,
  containerStyle,
  edges,
  ...props
}: BottomSheetProps) {
  const resolvedBackdropStyle = useResolvedStyle(backdropClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);

  return (
    <BottomSheetPrimitive
      {...props}
      edges={edges}
      backdropStyle={[backdropStyle, resolvedBackdropStyle]}
      containerStyle={[containerStyle, resolvedContainerStyle]}
    />
  );
}

type ButtonProps = BaseButtonProps & {
  buttonClassName?: string;
  containerClassName?: string;
  iconContainerClassName?: string;
  titleClassName?: string;
  children?: React.ReactNode;
};

export function Button({
  buttonClassName,
  containerClassName,
  iconContainerClassName,
  titleClassName,
  buttonStyle,
  containerStyle,
  iconContainerStyle,
  titleStyle,
  ...props
}: ButtonProps) {
  const resolvedButtonStyle = useResolvedStyle(buttonClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedIconContainerStyle = useResolvedStyle(iconContainerClassName);
  const resolvedTitleStyle = useResolvedStyle(titleClassName);

  return (
    <ButtonPrimitive
      {...props}
      buttonStyle={[buttonStyle, resolvedButtonStyle]}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      iconContainerStyle={[iconContainerStyle, resolvedIconContainerStyle]}
      titleStyle={[titleStyle, resolvedTitleStyle]}
    />
  );
}

type CardProps = BaseCardProps & {
  containerClassName?: string;
  wrapperClassName?: string;
  children?: React.ReactNode;
};

function CardBase({
  containerClassName,
  wrapperClassName,
  containerStyle,
  wrapperStyle,
  ...props
}: CardProps) {
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedWrapperStyle = useResolvedStyle(wrapperClassName);

  return (
    <CardPrimitive
      {...props}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      wrapperStyle={[wrapperStyle, resolvedWrapperStyle]}
    />
  );
}

type CardTitleProps = BaseTextProps & {
  className?: string;
};

function CardTitle({ className, style, ...props }: CardTitleProps) {
  const resolvedStyle = useResolvedStyle(className);

  return <BaseCard.Title {...props} style={[style, resolvedStyle]} />;
}

export const Card = Object.assign(CardBase, {
  Divider: BaseCard.Divider,
  FeaturedSubtitle: BaseCard.FeaturedSubtitle,
  FeaturedTitle: BaseCard.FeaturedTitle,
  Image: BaseCard.Image,
  Title: CardTitle,
});

type CheckBoxProps = Omit<PressableProps, "children" | "onPress"> & {
  checked: boolean;
  title?: React.ReactNode;
  onPress?: () => void;
  checkedColor?: string;
  uncheckedColor?: string;
  size?: number;
  checkedColorClassName?: string;
  containerClassName?: string;
  textClassName?: string;
  wrapperClassName?: string;
};

export function CheckBox({
  checked,
  title,
  onPress,
  disabled,
  checkedColorClassName,
  containerClassName,
  textClassName,
  wrapperClassName,
  checkedColor,
  uncheckedColor,
  size = 24,
  ...props
}: CheckBoxProps) {
  const resolvedCheckedColor = useResolvedColor(checkedColorClassName);
  const activeColor = resolvedCheckedColor ?? checkedColor;

  return (
    <Pressable
      {...props}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      className={containerClassName}
      disabled={disabled}
      onPress={onPress}
    >
      <View className={`flex-row items-center gap-2 ${wrapperClassName ?? ""}`}>
        <NativeCheckBox
          accessible={false}
          disabled={disabled}
          value={checked}
          tintColors={{ true: activeColor, false: uncheckedColor }}
          tintColor={uncheckedColor}
          onCheckColor={activeColor ? "#ffffff" : undefined}
          onFillColor={activeColor}
          onTintColor={activeColor}
          pointerEvents="none"
          style={{ width: size, height: size }}
        />
        {typeof title === "string" || typeof title === "number" ? (
          <Text className={textClassName}>{title}</Text>
        ) : (
          title
        )}
      </View>
    </Pressable>
  );
}

type DialogProps = BaseDialogProps & {
  backdropClassName?: string;
  overlayClassName?: string;
};

function DialogBase({
  backdropClassName,
  overlayClassName,
  backdropStyle,
  overlayStyle,
  ...props
}: DialogProps) {
  const resolvedBackdropStyle = useResolvedStyle(backdropClassName);
  const resolvedOverlayStyle = useResolvedStyle(overlayClassName);

  return (
    <BaseDialog
      {...props}
      backdropStyle={[backdropStyle, resolvedBackdropStyle]}
      overlayStyle={[overlayStyle, resolvedOverlayStyle]}
    />
  );
}

type DialogButtonProps = BaseDialogButtonProps & {
  buttonClassName?: string;
  containerClassName?: string;
  iconContainerClassName?: string;
  titleClassName?: string;
  children?: React.ReactNode;
};

function DialogButton({
  buttonClassName,
  containerClassName,
  iconContainerClassName,
  titleClassName,
  buttonStyle,
  containerStyle,
  iconContainerStyle,
  titleStyle,
  ...props
}: DialogButtonProps) {
  const resolvedButtonStyle = useResolvedStyle(buttonClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedIconContainerStyle = useResolvedStyle(iconContainerClassName);
  const resolvedTitleStyle = useResolvedStyle(titleClassName);

  return (
    <DialogButtonPrimitive
      {...props}
      buttonStyle={[buttonStyle, resolvedButtonStyle]}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      iconContainerStyle={[iconContainerStyle, resolvedIconContainerStyle]}
      titleStyle={[titleStyle, resolvedTitleStyle]}
    />
  );
}

type DialogTitleProps = BaseDialogTitleProps & {
  titleClassName?: string;
};

function DialogTitle({ titleClassName, titleStyle, ...props }: DialogTitleProps) {
  const resolvedTitleStyle = useResolvedStyle(titleClassName);

  return <BaseDialog.Title {...props} titleStyle={[titleStyle, resolvedTitleStyle]} />;
}

export const Dialog = Object.assign(DialogBase, {
  Actions: BaseDialog.Actions,
  Button: DialogButton,
  Loading: BaseDialog.Loading,
  Title: DialogTitle,
});

type StyledFlashListProps<T> = FlashListProps<T> & {
  className?: string;
  contentContainerClassName?: string;
  ListFooterComponentClassName?: string;
  ListHeaderComponentClassName?: string;
};

type FlashListComponent = <T>(
  props: StyledFlashListProps<T> & { ref?: React.Ref<FlashListRef<T>> },
) => React.ReactElement;

const FlashListBase = React.forwardRef(function FlashListInner<T>(
  {
    className,
    contentContainerClassName,
    ListFooterComponentClassName,
    ListHeaderComponentClassName,
    style,
    contentContainerStyle,
    ListFooterComponentStyle,
    ListHeaderComponentStyle,
    ...props
  }: StyledFlashListProps<T>,
  ref: React.ForwardedRef<FlashListRef<T>>,
) {
  const resolvedStyle = useResolvedStyle(className);
  const resolvedContentContainerStyle = useResolvedStyle(contentContainerClassName);
  const resolvedFooterStyle = useResolvedStyle(ListFooterComponentClassName);
  const resolvedHeaderStyle = useResolvedStyle(ListHeaderComponentClassName);

  return (
    <BaseFlashList
      {...props}
      ref={ref}
      style={{ ...style, ...resolvedStyle }}
      contentContainerStyle={[contentContainerStyle, resolvedContentContainerStyle]}
      ListFooterComponentStyle={[ListFooterComponentStyle, resolvedFooterStyle]}
      ListHeaderComponentStyle={[ListHeaderComponentStyle, resolvedHeaderStyle]}
    />
  );
}) as FlashListComponent;

export const FlashList = FlashListBase;

type ListItemProps = BaseListItemProps & {
  containerClassName?: string;
};

function ListItemBase({ containerClassName, containerStyle, ...props }: ListItemProps) {
  const resolvedContainerStyle = useResolvedStyle(containerClassName);

  return <BaseListItem {...props} containerStyle={[containerStyle, resolvedContainerStyle]} />;
}

type ListItemAccordionProps = BaseListItemAccordionProps & {
  containerClassName?: string;
};

function ListItemAccordion({
  containerClassName,
  containerStyle,
  ...props
}: ListItemAccordionProps) {
  const resolvedContainerStyle = useResolvedStyle(containerClassName);

  return (
    <ListItemAccordionPrimitive
      {...props}
      containerStyle={[containerStyle, resolvedContainerStyle]}
    />
  );
}

export const ListItem = Object.assign(ListItemBase, {
  Accordion: ListItemAccordion,
  Content: BaseListItem.Content,
  Input: BaseListItem.Input,
  Subtitle: BaseListItem.Subtitle,
  Title: BaseListItem.Title,
});

type OverlayProps = BaseOverlayProps & {
  backdropClassName?: string;
  overlayClassName?: string;
  children?: React.ReactNode;
};

export function Overlay({
  backdropClassName,
  overlayClassName,
  backdropStyle,
  overlayStyle,
  ...props
}: OverlayProps) {
  const resolvedBackdropStyle = useResolvedStyle(backdropClassName);
  const resolvedOverlayStyle = useResolvedStyle(overlayClassName);

  return (
    <OverlayPrimitive
      {...props}
      backdropStyle={[backdropStyle, resolvedBackdropStyle]}
      overlayStyle={[overlayStyle, resolvedOverlayStyle]}
    />
  );
}

type SkeletonProps = BaseSkeletonProps & {
  className?: string;
  skeletonClassName?: string;
};

type SwitchProps = NativeSwitchProps & {
  colorClassName?: string;
  iosBackgroundColorClassName?: string;
  trackColorOnClassName?: string;
  trackColorOffClassName?: string;
};

export function Switch({
  colorClassName,
  iosBackgroundColorClassName,
  trackColorOnClassName,
  trackColorOffClassName,
  thumbColor,
  ios_backgroundColor,
  trackColor,
  ...props
}: SwitchProps) {
  const resolvedColor = useResolvedColor(colorClassName);
  const resolvedIosBackgroundColor = useResolvedColor(iosBackgroundColorClassName);
  const resolvedTrackColorOn = useResolvedColor(trackColorOnClassName);
  const resolvedTrackColorOff = useResolvedColor(trackColorOffClassName);

  return (
    <NativeSwitch
      {...props}
      thumbColor={resolvedColor ?? thumbColor}
      ios_backgroundColor={resolvedIosBackgroundColor ?? ios_backgroundColor}
      trackColor={{
        false: resolvedTrackColorOff ?? trackColor?.false,
        true: resolvedTrackColorOn ?? trackColor?.true,
      }}
    />
  );
}

export function Skeleton({
  className,
  skeletonClassName,
  style,
  skeletonStyle,
  ...props
}: SkeletonProps) {
  const resolvedClassStyle = useResolvedStyle(className);
  const resolvedSkeletonStyle = useResolvedStyle(skeletonClassName);

  return (
    <BaseSkeleton
      {...props}
      style={[style, resolvedClassStyle]}
      skeletonStyle={[skeletonStyle, resolvedSkeletonStyle]}
    />
  );
}

type TextProps = NativeTextProps & {
  className?: string;
};

const nativeTextBaseStyle = Platform.select<TextStyle>({
  android: {
    fontFamily: "sans-serif",
    fontWeight: "normal",
  },
});

export function Text({ className, style, accessibilityRole = "text", ...props }: TextProps) {
  const defaultColorStyle = useResolvedStyle(colors.black.text);
  const resolvedStyle = useResolvedStyle(className);

  return (
    <NativeText
      {...props}
      accessibilityRole={accessibilityRole}
      style={[nativeTextBaseStyle, defaultColorStyle, style, resolvedStyle]}
    />
  );
}

const BottomSheetPrimitive = BaseBottomSheet as unknown as React.ComponentType<BottomSheetProps>;
const ButtonPrimitive = BaseButton as unknown as React.ComponentType<ButtonProps>;
const CardPrimitive = BaseCard as unknown as React.ComponentType<CardProps>;
const DialogButtonPrimitive =
  BaseDialog.Button as unknown as React.ComponentType<DialogButtonProps>;
const ListItemAccordionPrimitive =
  BaseListItem.Accordion as unknown as React.ComponentType<ListItemAccordionProps>;
const OverlayPrimitive = BaseOverlay as unknown as React.ComponentType<OverlayProps>;
export { ThemeProvider, createTheme };
export type { FlashListProps, FlashListRef };
