/* An opt-in morning reminder with that day's sky, made on the phone a week ahead.
   No server and no account: the phone schedules them itself, and they are rebuilt each time the app opens. */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Reading } from './seed';
import { todaySky } from './today';
import { getSettings, setSetting } from './settings';

const IDS = [101, 102, 103, 104, 105, 106, 107];
export const canRemind = () => Capacitor.isNativePlatform();

export function reminderLine(r: Reading, day: Date): { title: string; body: string } {
  const sky = todaySky(r, day);
  return { title: `${sky.title}, in ${sky.signName}`, body: `${sky.line.split('. ')[0]}. Today's trial: ${sky.pressing}.` };
}

async function schedule(r: Reading): Promise<void> {
  await LocalNotifications.cancel({ notifications: IDS.map(id => ({ id })) }).catch(() => {});
  const now = new Date(), list = [];
  for (let d = 0; d < IDS.length; d++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 8, 0, 0);
    if (at <= now) continue;
    const { title, body } = reminderLine(r, at);
    list.push({ id: IDS[d], title, body, schedule: { at, allowWhileIdle: true } });
  }
  if (list.length) await LocalNotifications.schedule({ notifications: list });
}

/* Turn the reminder on (asks the phone's permission) or off. Returns whether it is on. */
export async function setReminder(r: Reading, on: boolean): Promise<boolean> {
  if (!canRemind()) return false;
  try {
    if (!on) { await LocalNotifications.cancel({ notifications: IDS.map(id => ({ id })) }); setSetting('reminder', false); return false; }
    const p = await LocalNotifications.requestPermissions();
    if (p.display !== 'granted') { setSetting('reminder', false); return false; }
    setSetting('reminder', true);
    await schedule(r);
    return true;
  } catch { return false; }
}

/* Each time the app opens, schedule the coming week again from today. */
export function refreshReminder(r: Reading): void {
  if (canRemind() && getSettings().reminder) void schedule(r).catch(() => {});
}
