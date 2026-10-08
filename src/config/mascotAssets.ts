// src/config/mascotAssets.ts

export const MASCOT_HERO_ASSETS = {
  PRELOADER: require('../../assets/mascot/hero-assets/01_shopping_bag_cat.png'),
  RESET_WIPE: require('../../assets/mascot/hero-assets/02_ufo_abduction_cat.png'),
  PAUSED: require('../../assets/mascot/hero-assets/03_fishbowl_cat.png'),
  OFFLINE: require('../../assets/mascot/hero-assets/04_paper_bag_head_cat.png'),
  CAMERA: require('../../assets/mascot/hero-assets/05_camera_cat.png'),
  LIMIT_ALERT: require('../../assets/mascot/hero-assets/06_jar_head_cat.png'),
  IDLE: require('../../assets/mascot/hero-assets/07_cardboard_box_cat.png'),
  SHORT_BREAK: require('../../assets/mascot/hero-assets/08_bowl_cat.png'),
  DEEP_FOCUS: require('../../assets/mascot/hero-assets/09_boss_mug_cat.png'),
  DARK_MODE: require('../../assets/mascot/hero-assets/10_witch_cat.png'),
  ACTIVE_FOCUS: require('../../assets/mascot/hero-assets/11_laptop_cat.png'),
  ARCHIVE_LOGS: require('../../assets/mascot/hero-assets/12_open_box_cat.png'),
  AUTH_ERROR: require('../../assets/mascot/hero-assets/13_tube_cat.png'),
} as const;

export const MASCOT_SUB_ASSETS = {
  HEART: require('../../assets/mascot/sub-assets/01_heart_cat.png'),
  IDEA: require('../../assets/mascot/sub-assets/02_lightbulb_cat.png'),
  SLEEPING: require('../../assets/mascot/sub-assets/03_zzz_cat.png'),
  STAR_EYES: require('../../assets/mascot/sub-assets/04_star_eyes_cat.png'),
  OK_PAW: require('../../assets/mascot/sub-assets/05_ok_paw_cat.png'),
  ENVELOPE: require('../../assets/mascot/sub-assets/06_envelope_cat.png'),
  ALERT: require('../../assets/mascot/sub-assets/07_alert_cat.png'),
  SWIRL_EYES: require('../../assets/mascot/sub-assets/08_swirl_eyes_cat.png'),
  PEEKING: require('../../assets/mascot/sub-assets/09_peeking_cat.png'),
  PAW_PRINTS: require('../../assets/mascot/sub-assets/10_paw_prints.png'),
} as const;

export type MascotHeroKey = keyof typeof MASCOT_HERO_ASSETS;
export type MascotSubKey = keyof typeof MASCOT_SUB_ASSETS;