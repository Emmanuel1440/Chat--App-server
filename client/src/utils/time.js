// utils/time.js
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const formatTimeAgo = (timestamp) => dayjs(timestamp).fromNow();
