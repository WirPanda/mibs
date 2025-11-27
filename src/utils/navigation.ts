import { router, type Href } from 'expo-router';

export const safeGoBack = (fallback: Href = '/') => {
  try {
    const canGoBack = router.canGoBack();
    console.log('[navigation] safeGoBack invoked', { canGoBack, fallback });
    if (canGoBack) {
      router.back();
      return;
    }
    router.navigate(fallback);
  } catch (error) {
    console.log('[navigation] safeGoBack error', error);
    router.navigate(fallback);
  }
};
