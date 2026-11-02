// Editor Library tab (Figma 451:1595): Community motions + 3D assets (NVIDIA SimReady).
export const LIBRARY = {
  community: "Community",
  assets: "3D Asset",
  openCommunity: "Open Community",
  resetScene: "Clear the space",
  resetConfirm: { title: "Clear the space?", body: "Every placed object is removed and the robot goes back to its spot on the floor.", confirm: "Clear" },
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
  /** 3D asset tiles per page (3 × 3) once there are 10 or more */
  assetPageSize: 9,
} as const;
