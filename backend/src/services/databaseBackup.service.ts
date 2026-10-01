import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { getAppSettings } from '../utils/appSettings';
import { uploadPrivateFileToDrive } from './googleDrive.service';
import { buildDatabaseBackupFileName, getNextDatabaseBackupAt } from './databaseBackup.utils';

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

type DatabaseBackupStatus = {
  running: boolean;
  nextScheduledAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFileName: string | null;
  lastError: string | null;
};

let backupTimer: NodeJS.Timeout | null = null;
let backupStatus: DatabaseBackupStatus = {
  running: false,
  nextScheduledAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastFileName: null,
  lastError: null,
};

const getDatabaseDumpArguments = (databaseUrl: string, outputPath: string) => {
  const parsedUrl = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol.');
  }

  const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''));
  if (!parsedUrl.hostname || !databaseName || !parsedUrl.username) {
    throw new Error('DATABASE_URL is missing the PostgreSQL host, database, or username.');
  }

  return {
    args: ['--format=custom', '--no-owner', '--no-privileges', '--file', outputPath],
    env: {
      ...process.env,
      PGHOST: parsedUrl.hostname,
      PGPORT: parsedUrl.port || '5432',
      PGUSER: decodeURIComponent(parsedUrl.username),
      PGPASSWORD: decodeURIComponent(parsedUrl.password),
      PGDATABASE: databaseName,
      PGSSLMODE: parsedUrl.searchParams.get('sslmode') || process.env.PGSSLMODE || 'prefer',
    },
  };
};

const runPgDump = async (outputPath: string) => {
  const databaseUrl = process.env.DATABASE_URL?.trim().replace(/^['"]|['"]$/g, '');
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured for database backups.');

  const { args, env } = getDatabaseDumpArguments(databaseUrl, outputPath);
  const dumpCommand = process.env.PG_DUMP_PATH?.trim() || 'pg_dump';
  const dumpProcess = spawn(dumpCommand, args, { env, stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';

  dumpProcess.stderr.setEncoding('utf8');
  dumpProcess.stderr.on('data', (chunk: string) => {
    stderr += chunk;
  });

  const exitPromise = new Promise<number>((resolve, reject) => {
    dumpProcess.once('error', reject);
    dumpProcess.once('close', (code) => resolve(code ?? 1));
  });

  const exitCode = await exitPromise;
  if (exitCode !== 0) {
    const detail = stderr.trim().replace(/\s+/g, ' ').slice(0, 500);
    throw new Error(`pg_dump failed${detail ? `: ${detail}` : '.'}`);
  }
};

export const getDatabaseBackupStatus = () => ({ ...backupStatus });

export const runDatabaseBackup = async () => {
  if (backupStatus.running) throw new Error('A database backup is already running.');

  const settings = (await getAppSettings()).googleDrive;
  if (!settings.enabled || !settings.clientId || !settings.clientSecret || !settings.refreshToken) {
    throw new Error('Google Drive is not enabled or its credentials are incomplete.');
  }
  if (!settings.backupRootFolderId) {
    throw new Error('Private / Backup Root Folder ID is not configured.');
  }

  backupStatus = { ...backupStatus, running: true, lastError: null };
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dealmymachine-db-backup-'));
  const fileName = buildDatabaseBackupFileName();
  const outputPath = path.join(temporaryDirectory, fileName);

  try {
    await runPgDump(outputPath);
    const backupBuffer = await fs.readFile(outputPath);
    if (backupBuffer.length === 0) throw new Error('pg_dump produced an empty backup file.');

    const uploaded = await uploadPrivateFileToDrive(backupBuffer, 'application/octet-stream', fileName);
    if (!uploaded?.fileId) throw new Error('Google Drive did not return a backup file ID.');

    backupStatus = {
      running: false,
      nextScheduledAt: backupStatus.nextScheduledAt,
      lastSuccessAt: new Date().toISOString(),
      lastFailureAt: backupStatus.lastFailureAt,
      lastFileName: fileName,
      lastError: null,
    };
    return { fileName, fileId: uploaded.fileId, sizeBytes: backupBuffer.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database backup error.';
    backupStatus = { ...backupStatus, running: false, lastFailureAt: new Date().toISOString(), lastError: message };
    throw error;
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
};

export const startDatabaseBackupJob = () => {
  if (process.env.DATABASE_BACKUP_ENABLED?.trim().toLowerCase() === 'false') {
    console.log('[Database Backup] Disabled by DATABASE_BACKUP_ENABLED.');
    return;
  }
  if (backupTimer) return;

  const scheduleNext = () => {
    const nextRun = getNextDatabaseBackupAt();
    const delay = Math.max(1000, Math.min(nextRun.getTime() - Date.now(), BACKUP_INTERVAL_MS));
    backupStatus = { ...backupStatus, nextScheduledAt: nextRun.toISOString() };
    console.log(`[Database Backup] Next backup scheduled for ${nextRun.toISOString()}.`);
    backupTimer = setTimeout(async () => {
      backupTimer = null;
      try {
        await runDatabaseBackup();
        console.log('[Database Backup] Backup uploaded to Google Drive successfully.');
      } catch (error) {
        console.error('[Database Backup] Backup failed:', error instanceof Error ? error.message : error);
      } finally {
        scheduleNext();
      }
    }, delay);
    backupTimer.unref?.();
  };

  scheduleNext();
};
