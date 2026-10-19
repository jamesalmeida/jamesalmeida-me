// How the full-screen shell should sit in the visual viewport, including when
// the iOS keyboard shrinks or scrolls that viewport.

const KEYBOARD_OVERLAP_PX = 80;
const KEYBOARD_OFFSET_PX = 40;
const SHORT_PHONE_HEIGHT_PX = 520;
const PHONE_WIDTH_PX = 500;

export function readVisualViewportBox(metrics: {
  innerHeight: number;
  innerWidth: number;
  height: number;
  offsetTop: number;
}) {
  const keyboard = Math.max(0, metrics.innerHeight - metrics.height - metrics.offsetTop);
  const shortPhone = metrics.height < SHORT_PHONE_HEIGHT_PX && metrics.innerWidth < PHONE_WIDTH_PX;
  return {
    height: metrics.height,
    offset: metrics.offsetTop,
    keyboardOpen: keyboard > KEYBOARD_OVERLAP_PX || metrics.offsetTop > KEYBOARD_OFFSET_PX || shortPhone,
  };
}
