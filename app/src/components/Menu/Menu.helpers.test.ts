import { describe, expect, test, vi } from "vitest";
import React from "react";

import {
  createMenuOptionsCustomStyles,
  enhanceMenuChildren,
  handleControlledMenuBackPress,
  menuOptionTextStyle,
  menuOptionWrapperStyle,
  menuSurfaceStyle,
} from "./Menu.helpers";
import { menuOptionsContainerStyle } from "./Menu.styles";

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
        optionWrapper: menuOptionWrapperStyle,
        optionsWrapper: { borderRadius: 8 },
      },
    });
  });
});
