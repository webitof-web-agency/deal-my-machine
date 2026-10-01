import app from './app';
import { startSoldListingRetentionJob } from './utils/soldListingRetention';
import { startKeepAlive } from './utils/keepAlive';
import { backfillPersistedPublicBrandingAssets } from './utils/appSettings';
import { startDatabaseBackupJob } from './services/databaseBackup.service';

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';

startSoldListingRetentionJob();
startDatabaseBackupJob();
void backfillPersistedPublicBrandingAssets().catch((error) => {
  console.error('Branding asset backfill failed:', error);
});

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  startKeepAlive(PORT);
});
