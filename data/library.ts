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
  already: "\"{name}\" is already a reference",
  full: "References are full",
  /** Community cards per page (2 × 2) */
  pageSize: 4,
} as const;
