// Editor right panel (Figma 452:2024): Motion Dynamics · Motion Behavior · Joint · Edit Detail + the Motion / Face / Sound rail.
export const EDITOR_PANEL = {
  rail: { motion: "Motion", face: "Face", sound: "Sound" },
  dynamics: {
    title: "Motion Dynamics",
    amplitude: "Amplitude",
    duration: "Duration",
    smoothness: "Smoothness",
    speed: "Speed",
    frequency: "Frequency",
    /** Smoothness steps → MotionProps.smoothness */
    smoothSteps: [
      { label: "Sharp", value: 20 },
      { label: "Medium", value: 50 },
      { label: "Soft", value: 80 },
    ],
    /** Speed steps (× playback rate; MotionProps.speed spans 0.5–1.5 ×, lib/expression PROP_RANGES) */
    speedSteps: [0.5, 0.75, 1, 1.25, 1.5],
  },
  behavior: {
    title: "Motion Behavior",
    easing: "Easing",
    direction: "Direction",
    delay: "Delay",
    easings: {
      auto: "Auto",
      linear: "Linear",
      ease_in_out: "Ease In Out",
      ease_in: "Ease In",
      ease_out: "Ease Out",
      ease_out_back: "Back",
      ease_out_elastic: "Elastic",
      ease_out_bounce: "Bounce",
    },
    directions: { left: "Left", right: "Right" },
  },
  joint: { title: "Joint", auto: "Auto" },
  editDetail: "Edit Detail",
  closeDetail: "Close Detail",
} as const;
