import { describe, expect, test, vi } from "vitest";
import React from "react";

vi.mock("react-native", () => ({
  TouchableHighlight: "TouchableHighlight",
}));

vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));

import {
  createMenuOptionsCustomStyles,
  enhanceMenuChildren,
  handleControlledMenuBackPress,
} from "./Menu.helpers";
import {
  createMenuOptionTextStyle,
  createMenuSurfaceStyle,
  createMenuThemeStyles,
  defaultMenuThemeStyles,
  MenuOptionTouchableComponent,
  menuOptionTextStyle,
  menuOptionTouchableProps,
  menuOptionWrapperStyle,
  menuOptionsContainerStyle,
  menuSurfaceStyle,
  resolveStyleColor,
} from "./Menu.styles";

describe("handleControlledMenuBackPress", () => {
  test("closes an opened controlled menu and consumes the back event", () => {
    const onClose = vi.fn();

    expect(handleControlledMenuBackPress({ opened: true, onClose })).toBe(true);

    expect(onClose).toHaveBeenCalledOnce();
  });

  test("does not handle back presses when the controlled menu is closed", () => {
    const onClose = vi.fn();

    expect(handleControlledMenuBackPress({ opened: false, onClose })).toBe(false);

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("createMenuOptionsCustomStyles", () => {
  test("injects shared menu surface and option styles by default", () => {
    expect(createMenuOptionsCustomStyles({})).toMatchObject({
      OptionTouchableComponent: MenuOptionTouchableComponent,
      optionTouchable: menuOptionTouchableProps,
      optionsWrapper: menuSurfaceStyle,
      optionWrapper: menuOptionWrapperStyle,
      optionText: menuOptionTextStyle,
    });
  });

  test("lets callers override shared option wrapper styles", () => {
    const optionWrapper = { padding: 8 };
    const optionsWrapper = { borderRadius: 8 };

    expect(createMenuOptionsCustomStyles({ optionWrapper, optionsWrapper })).toMatchObject({
      optionsWrapper,
      optionWrapper,
    });
  });

  test("uses theme styles so the options follow the color scheme", () => {
    const themeStyles = createMenuThemeStyles({
      optionTextColor: "#e5e5e5",
      surfaceBackgroundColor: "#171717",
      surfaceBorderColor: "#262626",
    });

    expect(createMenuOptionsCustomStyles({}, themeStyles)).toMatchObject({
      optionsWrapper: {
        backgroundColor: "#171717",
        borderColor: "#262626",
        borderWidth: 1,
      },
      optionText: {
        color: "#e5e5e5",
        fontSize: 14,
      },
    });
  });
});

describe("createMenuThemeStyles", () => {
  test("keeps the light styles when no color is resolved", () => {
    expect(defaultMenuThemeStyles).toEqual({
      optionText: menuOptionTextStyle,
      optionsWrapper: menuSurfaceStyle,
    });
    expect(createMenuThemeStyles({})).toEqual(defaultMenuThemeStyles);
  });

  test("only replaces the colors that were resolved", () => {
    expect(createMenuSurfaceStyle("#171717")).toMatchObject({
      backgroundColor: "#171717",
      borderColor: menuSurfaceStyle.borderColor,
      borderRadius: 4,
      shadowOpacity: 0.15,
    });
    expect(createMenuOptionTextStyle("#e5e5e5")).toMatchObject({
      color: "#e5e5e5",
      fontSize: 14,
      paddingHorizontal: 16,
    });
  });
});

describe("resolveStyleColor", () => {
  test("keeps string colors and drops every other value", () => {
    expect(resolveStyleColor("#171717")).toBe("#171717");
    expect(resolveStyleColor(undefined)).toBeUndefined();
    expect(resolveStyleColor({ dynamic: true })).toBeUndefined();
  });
});

describe("enhanceMenuChildren", () => {
  test("keeps popup-menu MenuOptions recognizable while injecting shared styles", () => {
    function PopupMenuOptions() {
      return null;
    }

    const children = enhanceMenuChildren(
      React.createElement(PopupMenuOptions, {
        customStyles: { optionsWrapper: { borderRadius: 8 } },
      }),
      PopupMenuOptions,
    );
    const child = React.Children.toArray(children)[0];

    expect(React.isValidElement(child)).toBe(true);
    if (!React.isValidElement(child)) {
      return;
    }

    expect(child.type).toBe(PopupMenuOptions);
    expect(child.props).toMatchObject({
      optionsContainerStyle: [menuOptionsContainerStyle, undefined],
      customStyles: {
        optionText: menuOptionTextStyle,
        optionTouchable: menuOptionTouchableProps,
        optionWrapper: menuOptionWrapperStyle,
        optionsWrapper: { borderRadius: 8 },
        OptionTouchableComponent: MenuOptionTouchableComponent,
      },
    });
  });

  test("injects the theme styles into MenuOptions", () => {
    function PopupMenuOptions() {
      return null;
    }

    const themeStyles = createMenuThemeStyles({
      optionTextColor: "#e5e5e5",
      surfaceBackgroundColor: "#171717",
    });
    const children = enhanceMenuChildren(
      React.createElement(PopupMenuOptions, {}),
      PopupMenuOptions,
      themeStyles,
    );
    const child = React.Children.toArray(children)[0];

    expect(React.isValidElement(child)).toBe(true);
    if (!React.isValidElement(child)) {
      return;
    }

    expect(child.props).toMatchObject({
      customStyles: {
        optionText: themeStyles.optionText,
        optionsWrapper: themeStyles.optionsWrapper,
      },
    });
  });
});
