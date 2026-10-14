/**
 * @status DISCONNECTED / RESERVED FOR NEXT VERSION
 * @file src/services/authService.ts
 * @description In-memory auth transition flags.
 * Currently disconnected: Basic login/registration switching is managed directly inside AuthNavigator.
 * Reserved for next version complex multi-step registration or onboarding interceptors.
 */

let isSigningUpFlag = false;

export const setSigningUp = (val: boolean): void => {
  isSigningUpFlag = val;
};

export const getIsSigningUp = (): boolean => {
  return isSigningUpFlag;
};