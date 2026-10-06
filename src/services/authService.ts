let isSigningUpFlag = false;

export const setSigningUp = (val: boolean): void => {
  isSigningUpFlag = val;
};

export const getIsSigningUp = (): boolean => {
  return isSigningUpFlag;
};