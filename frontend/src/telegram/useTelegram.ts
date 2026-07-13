import WebApp from "@twa-dev/sdk";

export function useTelegram() {
  const tg = WebApp;

  const ready = () => tg.ready();
  const expand = () => tg.expand();
  const close = () => tg.close();

  const showMainButton = (text: string, onClick: () => void) => {
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  };

  const hideMainButton = () => {
    tg.MainButton.hide();
    tg.MainButton.offClick(() => {});
  };

  const setMainButtonLoading = (loading: boolean) => {
    if (loading) tg.MainButton.showProgress();
    else tg.MainButton.hideProgress();
  };

  const showBackButton = (onClick: () => void) => {
    tg.BackButton.onClick(onClick);
    tg.BackButton.show();
  };

  const hideBackButton = () => {
    tg.BackButton.hide();
    tg.BackButton.offClick(() => {});
  };

  const haptic = {
    light: () => tg.HapticFeedback.impactOccurred("light"),
    medium: () => tg.HapticFeedback.impactOccurred("medium"),
    success: () => tg.HapticFeedback.notificationOccurred("success"),
    error: () => tg.HapticFeedback.notificationOccurred("error"),
    warning: () => tg.HapticFeedback.notificationOccurred("warning"),
  };

  const alert = (msg: string) => tg.showAlert(msg);
  const confirm = (msg: string, cb: (ok: boolean) => void) => tg.showConfirm(msg, cb);

  const colorScheme = tg.colorScheme; // "light" | "dark"
  const themeParams = tg.themeParams;
  const user = tg.initDataUnsafe?.user;
  const initData = tg.initData;

  return {
    tg,
    ready,
    expand,
    close,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    showBackButton,
    hideBackButton,
    haptic,
    alert,
    confirm,
    colorScheme,
    themeParams,
    user,
    initData,
  };
}
