import { createApp } from './app';
import { ENV } from './config/env';

const app = createApp();

const LOOPBACK_HOST = '127.0.0.1';

app.listen(ENV.PORT, LOOPBACK_HOST, () => {
  console.log(`Server listening on ${LOOPBACK_HOST}:${ENV.PORT}`);
});
