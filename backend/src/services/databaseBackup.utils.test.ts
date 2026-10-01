import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDatabaseBackupFileName, getNextDatabaseBackupAt } from './databaseBackup.utils';

test('schedules the next database backup at 3 AM India time', () => {
  const beforeBackup = new Date('2026-09-30T21:00:00.000Z');
  const afterBackup = new Date('2026-09-30T23:00:00.000Z');

  assert.equal(getNextDatabaseBackupAt(beforeBackup).toISOString(), '2026-09-30T21:30:00.000Z');
  assert.equal(getNextDatabaseBackupAt(afterBackup).toISOString(), '2026-10-01T21:30:00.000Z');
});

test('builds a stable, timezone-labelled backup filename', () => {
  assert.equal(
    buildDatabaseBackupFileName(new Date('2026-09-30T21:30:00.000Z')),
    'dealmymachine-db-2026-10-01-0300-IST.dump',
  );
});
