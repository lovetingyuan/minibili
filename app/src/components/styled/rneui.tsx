import React from "react";
import {
  Avatar as BaseAvatar,
  Badge as BaseBadge,
  BottomSheet as BaseBottomSheet,
  Button as BaseButton,
  Card as BaseCard,
  CheckBox as BaseCheckBox,
  Chip as BaseChip,
  Dialog as BaseDialog,
  Divider as BaseDivider,
  FAB as BaseFAB,
  Icon as BaseIcon,
  Input as BaseInput,
  ListItem as BaseListItem,
  Overlay as BaseOverlay,
  Skeleton as BaseSkeleton,
  Slider as BaseSlider,
  Text as BaseText,
  ThemeProvider,
  createTheme,
} from "@rneui/themed";
import type {
  AvatarProps as BaseAvatarProps,
  BadgeProps as BaseBadgeProps,
  BottomSheetProps as BaseBottomSheetProps,
  ButtonProps as BaseButtonProps,
  CardProps as BaseCardProps,
  CheckBoxProps as BaseCheckBoxProps,
  ChipProps as BaseChipProps,
  DialogButtonProps as BaseDialogButtonProps,
  DialogProps as BaseDialogProps,
  DialogTitleProps as BaseDialogTitleProps,
  DividerProps as BaseDividerProps,
  FABProps as BaseFABProps,
  IconProps as BaseIconProps,
  InputProps as BaseInputProps,
  ListItemAccordionProps as BaseListItemAccordionProps,
  ListItemProps as BaseListItemProps,
  OverlayProps as BaseOverlayProps,
  SkeletonProps as BaseSkeletonProps,
  SliderProps as BaseSliderProps,
  TextProps as BaseTextProps,
} from "@rneui/base";
import { FlashList as BaseFlashList } from "@shopify/flash-list";
import type { FlashListProps, FlashListRef } from "@shopify/flash-list";
import type { StyleProp, TextStyle } from "react-native";
import { useResolveClassNames } from "uniwind";

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

type AvatarProps = BaseAvatarProps & {
  avatarClassName?: string;
  containerClassName?: string;
  iconClassName?: string;
  overlayContainerClassName?: string;
  titleClassName?: string;
};

export function Avatar({
  avatarClassName,
  containerClassName,
  iconClassName,
  overlayContainerClassName,
  titleClassName,
  avatarStyle,
  containerStyle,
  iconStyle,
  overlayContainerStyle,
  titleStyle,
  ...props
}: AvatarProps) {
  const resolvedAvatarStyle = useResolvedStyle(avatarClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedIconStyle = useResolvedStyle(iconClassName);
  const resolvedOverlayContainerStyle = useResolvedStyle(overlayContainerClassName);
  const resolvedTitleStyle = useResolvedStyle(titleClassName);

  return (
    <BaseAvatar
      {...props}
      avatarStyle={{ ...avatarStyle, ...resolvedAvatarStyle }}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      iconStyle={[iconStyle, resolvedIconStyle]}
      overlayContainerStyle={[overlayContainerStyle, resolvedOverlayContainerStyle]}
      titleStyle={[titleStyle, resolvedTitleStyle]}
    />
  );
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
  children?: React.ReactNode;
};

export function BottomSheet({
  backdropClassName,
  containerClassName,
  backdropStyle,
  containerStyle,
  ...props
}: BottomSheetProps) {
  const resolvedBackdropStyle = useResolvedStyle(backdropClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);

  return (
    <BottomSheetPrimitive
      {...props}
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

type CheckBoxProps = BaseCheckBoxProps & {
  checkedColorClassName?: string;
  containerClassName?: string;
  textClassName?: string;
  wrapperClassName?: string;
  children?: React.ReactNode;
};

export function CheckBox({
  checkedColorClassName,
  containerClassName,
  textClassName,
  wrapperClassName,
  checkedColor,
  containerStyle,
  textStyle,
  wrapperStyle,
  ...props
}: CheckBoxProps) {
  const resolvedCheckedColor = useResolvedColor(checkedColorClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedTextStyle = useResolvedStyle(textClassName);
  const resolvedWrapperStyle = useResolvedStyle(wrapperClassName);

  return (
    <CheckBoxPrimitive
      {...props}
      checkedColor={resolvedCheckedColor ?? checkedColor}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      textStyle={[textStyle, resolvedTextStyle]}
      wrapperStyle={[wrapperStyle, resolvedWrapperStyle]}
    />
  );
}

type ChipProps = BaseChipProps & {
  buttonClassName?: string;
  containerClassName?: string;
  iconContainerClassName?: string;
  titleClassName?: string;
  children?: React.ReactNode;
};

export function Chip({
  buttonClassName,
  containerClassName,
  iconContainerClassName,
  titleClassName,
  buttonStyle,
  containerStyle,
  iconContainerStyle,
  titleStyle,
  ...props
}: ChipProps) {
  const resolvedButtonStyle = useResolvedStyle(buttonClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedIconContainerStyle = useResolvedStyle(iconContainerClassName);
  const resolvedTitleStyle = useResolvedStyle(titleClassName);

  return (
    <ChipPrimitive
      {...props}
      buttonStyle={[buttonStyle, resolvedButtonStyle]}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      iconContainerStyle={[iconContainerStyle, resolvedIconContainerStyle]}
      titleStyle={[titleStyle, resolvedTitleStyle]}
    />
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

type DividerProps = BaseDividerProps & {
  className?: string;
};

export function Divider({ className, style, ...props }: DividerProps) {
  const resolvedStyle = useResolvedStyle(className);

  return <BaseDivider {...props} style={[style, resolvedStyle]} />;
}

type FABProps = BaseFABProps & {
  buttonClassName?: string;
  className?: string;
  colorClassName?: string;
  containerClassName?: string;
  iconContainerClassName?: string;
  titleClassName?: string;
  children?: React.ReactNode;
};

export function FAB({
  buttonClassName,
  className,
  colorClassName,
  containerClassName,
  iconContainerClassName,
  titleClassName,
  buttonStyle,
  color,
  containerStyle,
  iconContainerStyle,
  style,
  titleStyle,
  ...props
}: FABProps) {
  const resolvedButtonStyle = useResolvedStyle(buttonClassName);
  const resolvedColor = useResolvedColor(colorClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedIconContainerStyle = useResolvedStyle(iconContainerClassName);
  const resolvedStyle = useResolvedStyle(className);
  const resolvedTitleStyle = useResolvedStyle(titleClassName);

  return (
    <FABPrimitive
      {...props}
      buttonStyle={[buttonStyle, resolvedButtonStyle]}
      color={resolvedColor ?? color}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      iconContainerStyle={[iconContainerStyle, resolvedIconContainerStyle]}
      style={[style, resolvedStyle]}
      titleStyle={[titleStyle, resolvedTitleStyle]}
    />
  );
}

type StyledFlashListProps<T> = FlashListProps<T> & {
  className?: string;
  contentContainerClassName?: string;
  columnWrapperClassName?: string;
  ListFooterComponentClassName?: string;
  ListHeaderComponentClassName?: string;
  estimatedFirstItemOffset?: number;
  estimatedItemSize?: number;
};

type FlashListComponent = <T>(
  props: StyledFlashListProps<T> & { ref?: React.Ref<FlashListRef<T>> },
) => React.ReactElement;

const FlashListBase = React.forwardRef(function FlashListInner<T>(
  {
    className,
    contentContainerClassName,
    columnWrapperClassName,
    ListFooterComponentClassName,
    ListHeaderComponentClassName,
    style,
    columnWrapperStyle,
    contentContainerStyle,
    ListFooterComponentStyle,
    ListHeaderComponentStyle,
    ...props
  }: StyledFlashListProps<T>,
  ref: React.ForwardedRef<FlashListRef<T>>,
) {
  const resolvedStyle = useResolvedStyle(className);
  const resolvedColumnWrapperStyle = useResolvedStyle(columnWrapperClassName);
  const resolvedContentContainerStyle = useResolvedStyle(contentContainerClassName);
  const resolvedFooterStyle = useResolvedStyle(ListFooterComponentClassName);
  const resolvedHeaderStyle = useResolvedStyle(ListHeaderComponentClassName);

  return (
    <BaseFlashList
      {...props}
      ref={ref}
      style={{ ...style, ...resolvedStyle }}
      columnWrapperStyle={[columnWrapperStyle, resolvedColumnWrapperStyle]}
      contentContainerStyle={[contentContainerStyle, resolvedContentContainerStyle]}
      ListFooterComponentStyle={[ListFooterComponentStyle, resolvedFooterStyle]}
      ListHeaderComponentStyle={[ListHeaderComponentStyle, resolvedHeaderStyle]}
    />
  );
}) as FlashListComponent;

export const FlashList = FlashListBase;

type IconProps = BaseIconProps & {
  className?: string;
  color?: string;
  colorClassName?: string;
  containerClassName?: string;
  iconStyle?: StyleProp<TextStyle>;
  iconClassName?: string;
  name?: string;
  size?: number;
};

function normalizeIconType(type?: BaseIconProps["type"]) {
  switch (type) {
    case "Ionicons":
    case "ionicons":
      return "ionicon";
    case "material-community":
      return "material-design";
    default:
      return type;
  }
}

export function Icon({
  className,
  colorClassName,
  containerClassName,
  iconClassName,
  color,
  containerStyle,
  iconStyle,
  type,
  ...props
}: IconProps) {
  const resolvedColor = useResolvedColor(colorClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedStyle = useResolvedStyle(className);
  const resolvedIconStyle = useResolvedStyle(iconClassName);

  return (
    <IconPrimitive
      {...props}
      color={resolvedColor ?? color}
      containerStyle={[containerStyle, resolvedContainerStyle, resolvedStyle]}
      iconStyle={[iconStyle, resolvedIconStyle]}
      type={normalizeIconType(type)}
    />
  );
}

type InputProps = BaseInputProps & {
  containerClassName?: string;
  disabledInputClassName?: string;
  errorClassName?: string;
  inputClassName?: string;
  inputContainerClassName?: string;
  labelClassName?: string;
  leftIconContainerClassName?: string;
  placeholderTextColorClassName?: string;
  rightIconContainerClassName?: string;
  selectionColorClassName?: string;
};

export function Input({
  containerClassName,
  disabledInputClassName,
  errorClassName,
  inputClassName,
  inputContainerClassName,
  labelClassName,
  leftIconContainerClassName,
  placeholderTextColorClassName,
  rightIconContainerClassName,
  selectionColorClassName,
  containerStyle,
  disabledInputStyle,
  errorStyle,
  inputContainerStyle,
  inputStyle,
  labelStyle,
  leftIconContainerStyle,
  placeholderTextColor,
  rightIconContainerStyle,
  selectionColor,
  ...props
}: InputProps) {
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedDisabledInputStyle = useResolvedStyle(disabledInputClassName);
  const resolvedErrorStyle = useResolvedStyle(errorClassName);
  const resolvedInputContainerStyle = useResolvedStyle(inputContainerClassName);
  const resolvedInputStyle = useResolvedStyle(inputClassName);
  const resolvedLabelStyle = useResolvedStyle(labelClassName);
  const resolvedLeftIconContainerStyle = useResolvedStyle(leftIconContainerClassName);
  const resolvedPlaceholderTextColor = useResolvedColor(placeholderTextColorClassName);
  const resolvedRightIconContainerStyle = useResolvedStyle(rightIconContainerClassName);
  const resolvedSelectionColor = useResolvedColor(selectionColorClassName);

  return (
    <InputPrimitive
      {...props}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      disabledInputStyle={[disabledInputStyle, resolvedDisabledInputStyle]}
      errorStyle={[errorStyle, resolvedErrorStyle]}
      inputContainerStyle={[inputContainerStyle, resolvedInputContainerStyle]}
      inputStyle={[inputStyle, resolvedInputStyle]}
      labelStyle={[labelStyle, resolvedLabelStyle]}
      leftIconContainerStyle={[leftIconContainerStyle, resolvedLeftIconContainerStyle]}
      placeholderTextColor={resolvedPlaceholderTextColor ?? placeholderTextColor}
      rightIconContainerStyle={[rightIconContainerStyle, resolvedRightIconContainerStyle]}
      selectionColor={resolvedSelectionColor ?? selectionColor}
    />
  );
}

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
  Chevron: BaseListItem.Chevron,
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

type SliderProps = BaseSliderProps & {
  className?: string;
  maximumTrackTintColorClassName?: string;
  minimumTrackTintColorClassName?: string;
  thumbClassName?: string;
  thumbTintColorClassName?: string;
  trackClassName?: string;
};

export function Slider({
  className,
  maximumTrackTintColor,
  maximumTrackTintColorClassName,
  minimumTrackTintColor,
  minimumTrackTintColorClassName,
  style,
  thumbClassName,
  thumbStyle,
  thumbTintColor,
  thumbTintColorClassName,
  trackClassName,
  trackStyle,
  ...props
}: SliderProps) {
  const resolvedMaximumTrackTintColor = useResolvedColor(maximumTrackTintColorClassName);
  const resolvedMinimumTrackTintColor = useResolvedColor(minimumTrackTintColorClassName);
  const resolvedStyle = useResolvedStyle(className);
  const resolvedThumbStyle = useResolvedStyle(thumbClassName);
  const resolvedThumbTintColor = useResolvedColor(thumbTintColorClassName);
  const resolvedTrackStyle = useResolvedStyle(trackClassName);

  return (
    <BaseSlider
      {...props}
      maximumTrackTintColor={resolvedMaximumTrackTintColor ?? maximumTrackTintColor}
      minimumTrackTintColor={resolvedMinimumTrackTintColor ?? minimumTrackTintColor}
      style={[style, resolvedStyle]}
      thumbStyle={[thumbStyle, resolvedThumbStyle]}
      thumbTintColor={resolvedThumbTintColor ?? thumbTintColor}
      trackStyle={[trackStyle, resolvedTrackStyle]}
    />
  );
}

type TextProps = BaseTextProps & {
  className?: string;
};

export function Text({ className, style, ...props }: TextProps) {
  const resolvedStyle = useResolvedStyle(className);

  return <BaseText {...props} style={[style, resolvedStyle]} />;
}

const BottomSheetPrimitive = BaseBottomSheet as unknown as React.ComponentType<BottomSheetProps>;
const ButtonPrimitive = BaseButton as unknown as React.ComponentType<ButtonProps>;
const CardPrimitive = BaseCard as unknown as React.ComponentType<CardProps>;
const CheckBoxPrimitive = BaseCheckBox as unknown as React.ComponentType<CheckBoxProps>;
const ChipPrimitive = BaseChip as unknown as React.ComponentType<ChipProps>;
const DialogButtonPrimitive =
  BaseDialog.Button as unknown as React.ComponentType<DialogButtonProps>;
const FABPrimitive = BaseFAB as unknown as React.ComponentType<FABProps>;
const IconPrimitive = BaseIcon as unknown as React.ComponentType<IconProps>;
const InputPrimitive = BaseInput as unknown as React.ComponentType<BaseInputProps>;
const ListItemAccordionPrimitive =
  BaseListItem.Accordion as unknown as React.ComponentType<ListItemAccordionProps>;
const OverlayPrimitive = BaseOverlay as unknown as React.ComponentType<OverlayProps>;

export { ThemeProvider, createTheme };
export type { FlashListProps, FlashListRef };
