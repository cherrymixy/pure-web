// Editor Library tab (Figma 451:1595): Community motions + 3D assets (NVIDIA SimReady).
export const LIBRARY = {
  community: "Community",
  assets: "3D Asset",
  openCommunity: "Open Community",
  openAssets: "Open asset source",
  /** SimReady catalog the 3D assets come from (opens from the 3D Asset ↗) */
  assetsSource: "https://huggingface.co/datasets/nvidia/simready-assets",
  prev: "Previous",
  next: "Next",
  empty: "No community motions yet.",
  attached: "Added \"{name}\" as a reference",
  full: "References are full",
  place: "Place {name}",
  slotsFull: "No more {name} — remove one first",
  moveHint: "←↑↓→ Move · R Rotate 45° · Delete Remove · Esc Done",
  putRobot: "Put robot here",
  robotToFloor: "Robot to floor",
  remove: "Remove",
  robotInWay: "The robot is in the way",
  robot: "Robot",
  robotHint: "←↑↓→ Move · R Rotate 45° · Esc Done",
  robotBlocked: "Can't go there",
  /** Community cards per page (2 × 2) */
  pageSize: 4,
} as const;
