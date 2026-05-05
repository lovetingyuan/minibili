type MenuAnchorPositionInput = {
  measuredLeft: number;
  measuredTop: number;
  modalLeft: number;
  modalTop: number;
};

type MenuAnchorPosition = {
  left: number;
  top: number;
};

export function getMenuAnchorPosition({
  measuredLeft,
  measuredTop,
  modalLeft,
  modalTop,
}: MenuAnchorPositionInput): MenuAnchorPosition {
  return {
    left: measuredLeft - modalLeft,
    top: measuredTop - modalTop,
  };
}
