import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import React from "react";

type SheetBackdropConfigProps = {
  /** 遮罩最深时的透明度，0-1 */
  opacity: number;
  children: React.ReactNode;
};

const SheetBackdropConfigContext = React.createContext(0.5);

export function SheetBackdropConfig({ opacity, children }: SheetBackdropConfigProps) {
  return (
    <SheetBackdropConfigContext.Provider value={opacity}>
      {children}
    </SheetBackdropConfigContext.Provider>
  );
}

/**
 * 模块级稳定组件：gorhom 的 backdropComponent 一旦换了组件标识就会重新挂载，
 * 而 sheet 会随父组件（比如输入框）频繁重渲染，所以透明度通过 context 传入。
 *
 * appearsOnIndex / disappearsOnIndex 必须显式指定：单吸附点时默认值会让遮罩永远不显示。
 */
export function SheetBackdrop(props: BottomSheetBackdropProps) {
  const opacity = React.useContext(SheetBackdropConfigContext);

  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={opacity}
      pressBehavior="close"
    />
  );
}
