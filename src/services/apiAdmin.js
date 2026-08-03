import { supabase } from './supabase';
import { clearEoOrdersCache } from './apiOrders';
import { clearPublicEventsCache } from './apiEvents';

const isBrowser = typeof window !== 'undefined';
const STORAGE_PAGE_SIZE = 100;
const TABLE_PAGE_SIZE = 500;

const RESET_MODES = {
  quick: 'quick',
  factory: 'factory',
};

const RESET_PLANS = {
  [RESET_MODES.quick]: {
    label: 'Quick Reset',
    description: 'hapus transaksi saja',
    tables: [
      { key: 'tickets', label: 'Tickets' },
      { key: 'orders', label: 'Orders' },
    ],
    buckets: [
      { key: 'tickets', label: 'Ticket Image' },
      { key: 'payment-proofs', label: 'Payment Proof' },
    ],
  },
  [RESET_MODES.factory]: {
    label: 'Factory Reset',
    description: 'hapus seluruh data operasional',
    tables: [
      { key: 'tickets', label: 'Tickets' },
      { key: 'orders', label: 'Orders' },
      { key: 'staff_accounts', label: 'Staff' },
      { key: 'ticket_categories', label: 'Ticket Categories' },
      { key: 'events', label: 'Events' },
    ],
    buckets: [
      { key: 'tickets', label: 'Ticket Image' },
      { key: 'payment-proofs', label: 'Payment Proof' },
      { key: 'event-posters', label: 'Event Poster' },
      { key: 'qris-codes', label: 'QRIS Image' },
    ],
  },
};

const getResetPlan = (mode = RESET_MODES.quick) => RESET_PLANS[mode] || RESET_PLANS[RESET_MODES.quick];

const countRowsStrict = async (tableName) => {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Gagal menghitung data tabel ${tableName}: ${error.message}`);
  }

  return count || 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_DELETE_SIZE = 100; // Supabase Storage remove() max per call
const MAX_EMPTY_RETRIES  = 10; // max iterasi outer loop per bucket
const BACKOFF_BASE_MS    = 500; // base backoff untuk exponential retry

/**
 * Sleep helper untuk exponential backoff.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Rekursif list SEMUA file path di dalam satu folder bucket.
 *
 * Strategi deteksi folder vs file:
 *   - Supabase mengembalikan item dengan metadata.mimetype untuk file aktual.
 *   - Item tanpa metadata (metadata === null/undefined) atau
 *     nama berakhiran '/' adalah folder virtual.
 *   - Item dengan nama '.emptyFolderPlaceholder' dilewati.
 *
 * @param {string} bucketName
 * @param {string} [prefix='']  path folder saat ini (tanpa trailing slash)
 * @returns {Promise<string[]>} array full path setiap file
 */
const listAllBucketFilePaths = async (bucketName, prefix = '') => {
  const filePaths = [];
  let offset = 0;

  while (true) {
    const { data: items, error } = await supabase.storage
      .from(bucketName)
      .list(prefix || '', {
        limit: STORAGE_PAGE_SIZE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      throw new Error(
        `Gagal list bucket "${bucketName}" prefix="${prefix || '(root)'}": ${error.message}`
      );
    }

    const chunk = items || [];

    for (const item of chunk) {
      if (!item.name) continue;

      // Lewati placeholder folder kosong Supabase
      if (item.name === '.emptyFolderPlaceholder') continue;

      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

      // Deteksi folder: tidak punya metadata mimetype ATAU id null
      const isFolder =
        item.id === null ||
        item.id === undefined ||
        !item.metadata ||
        item.metadata === null ||
        typeof item.metadata !== 'object' ||
        !item.metadata.mimetype;

      if (isFolder) {
        // Masuk rekursif ke subfolder
        const nested = await listAllBucketFilePaths(bucketName, fullPath);
        filePaths.push(...nested);
      } else {
        filePaths.push(fullPath);
      }
    }

    // Kalau chunk < limit, sudah habis
    if (chunk.length < STORAGE_PAGE_SIZE) break;
    offset += STORAGE_PAGE_SIZE;
  }

  return filePaths;
};

/**
 * Hapus satu batch file dengan exponential backoff retry.
 *
 * @param {string}   bucketName
 * @param {string[]} paths       array path file (max BATCH_DELETE_SIZE)
 * @param {number}   attempt     nomor percobaan saat ini (0-based)
 * @returns {Promise<{deleted: string[], failed: Array<{path:string, reason:string}>}>}
 */
const deleteBatchWithRetry = async (bucketName, paths, attempt = 0) => {
  const { data, error } = await supabase.storage.from(bucketName).remove(paths);

  if (!error) {
    // Supabase remove() mengembalikan array object file yang berhasil dihapus
    // (atau null/empty jika API tidak mendukung). Kita trust paths sebagai deleted.
    return { deleted: paths, failed: [] };
  }

  // Ada error — putuskan apakah retry atau report
  const isRetryable =
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('503') ||
    error.message?.toLowerCase().includes('502') ||
    error.statusCode === 503 ||
    error.statusCode === 502;

  if (isRetryable && attempt < 3) {
    const backoff = BACKOFF_BASE_MS * Math.pow(2, attempt);
    await sleep(backoff);
    return deleteBatchWithRetry(bucketName, paths, attempt + 1);
  }

  // Non-retryable atau habis retry → laporkan semua sebagai failed
  return {
    deleted: [],
    failed: paths.map((p) => ({ path: p, reason: error.message || 'Unknown error' })),
  };
};

/**
 * Kosongkan seluruh isi bucket secara tuntas.
 *
 * Algoritma:
 *   1. List semua file rekursif (termasuk subfolder).
 *   2. Hapus dalam batch BATCH_DELETE_SIZE dengan retry backoff.
 *   3. Setelah semua batch selesai, list ulang bucket.
 *   4. Jika masih ada file → ulangi dari langkah 1 (outer loop).
 *   5. Hentikan jika bucket = 0 atau MAX_EMPTY_RETRIES tercapai.
 *
 * @param {string}   bucketName
 * @param {Function} [onProgress]
 * @returns {Promise<{
 *   deleted: number,
 *   failedFiles: Array<{path:string, reason:string}>,
 *   finalCount: number,
 *   iterations: number,
 *   log: string[]
 * }>}
 */
const emptyBucket = async (bucketName, onProgress) => {
  let totalDeleted = 0;
  const allFailedFiles = [];
  const log = [];
  let iteration = 0;

  const emit = (msg) => {
    log.push(`[${bucketName}] ${msg}`);
    console.log(`[emptyBucket:${bucketName}] ${msg}`);
  };

  while (iteration < MAX_EMPTY_RETRIES) {
    iteration += 1;

    // ── Langkah 1: List semua file saat ini ──────────────────────────────
    let currentPaths;
    try {
      currentPaths = await listAllBucketFilePaths(bucketName);
    } catch (listErr) {
      emit(`ERROR list iterasi ${iteration}: ${listErr.message}`);
      allFailedFiles.push({ path: '(list-error)', reason: listErr.message });
      break;
    }

    emit(`Iterasi ${iteration}: ditemukan ${currentPaths.length} file.`);

    if (currentPaths.length === 0) {
      emit(`Bucket kosong. Selesai.`);
      break;
    }

    if (onProgress) {
      onProgress({
        bucketName,
        phase: 'listing',
        iteration,
        found: currentPaths.length,
        deleted: totalDeleted,
      });
    }

    // ── Langkah 2: Hapus dalam batch ─────────────────────────────────────
    let iterationDeleted = 0;
    const iterationFailed = [];

    for (let i = 0; i < currentPaths.length; i += BATCH_DELETE_SIZE) {
      const batch = currentPaths.slice(i, i + BATCH_DELETE_SIZE);
      emit(`  Batch ${Math.floor(i / BATCH_DELETE_SIZE) + 1}: menghapus ${batch.length} file...`);

      const { deleted: batchDeleted, failed: batchFailed } = await deleteBatchWithRetry(
        bucketName,
        batch
      );

      iterationDeleted += batchDeleted.length;

      if (batchFailed.length > 0) {
        emit(`  Batch gagal: ${batchFailed.length} file — ${batchFailed[0].reason}`);
        iterationFailed.push(...batchFailed);
      }

      if (onProgress) {
        onProgress({
          bucketName,
          phase: 'deleting',
          iteration,
          batchIndex: Math.floor(i / BATCH_DELETE_SIZE) + 1,
          batchSize: batch.length,
          batchDeleted: batchDeleted.length,
          batchFailed: batchFailed.length,
          totalDeleted: totalDeleted + iterationDeleted,
        });
      }
    }

    totalDeleted += iterationDeleted;
    allFailedFiles.push(...iterationFailed);

    emit(`  Iterasi ${iteration} selesai: ${iterationDeleted} terhapus, ${iterationFailed.length} gagal.`);

    // ── Langkah 3: Verifikasi ulang ──────────────────────────────────────
    let remaining;
    try {
      remaining = await listAllBucketFilePaths(bucketName);
    } catch (verErr) {
      emit(`ERROR verifikasi setelah iterasi ${iteration}: ${verErr.message}`);
      break;
    }

    emit(`  Sisa setelah iterasi ${iteration}: ${remaining.length} file.`);

    if (remaining.length === 0) {
      emit(`  Bucket bersih. Selesai.`);
      break;
    }

    // Masih ada file — cek apakah semua yang tersisa adalah dari failed files
    // (artinya tidak ada kemajuan yang bisa dicapai lagi)
    const remainingPaths = new Set(remaining);
    const failedPaths = new Set(allFailedFiles.map((f) => f.path));
    const nonFailedRemaining = remaining.filter((p) => !failedPaths.has(p));

    if (nonFailedRemaining.length === 0 && iterationFailed.length > 0) {
      emit(`  Semua sisa file (${remaining.length}) adalah file yang gagal dihapus. Stop.`);
      break;
    }

    // Kalau tidak ada progress sama sekali (tidak ada yang terhapus dan tidak ada failed baru)
    if (iterationDeleted === 0 && iterationFailed.length === 0) {
      emit(`  Tidak ada progress pada iterasi ${iteration}. Stop untuk mencegah infinite loop.`);
      break;
    }

    // Ada sisa non-failed → lanjut iterasi berikutnya
    emit(`  Masih ada ${nonFailedRemaining.length} file belum terhapus. Lanjut iterasi ${iteration + 1}...`);

    // Backoff kecil sebelum iterasi berikutnya
    if (iteration < MAX_EMPTY_RETRIES - 1) {
      await sleep(200 * iteration);
    }
  }

  // Final count
  let finalCount = 0;
  try {
    const finalPaths = await listAllBucketFilePaths(bucketName);
    finalCount = finalPaths.length;
  } catch (_) {
    finalCount = -1; // tidak bisa diverifikasi
  }

  emit(`FINAL: deleted=${totalDeleted}, failed=${allFailedFiles.length}, remaining=${finalCount}, iterations=${iteration}`);

  return {
    deleted: totalDeleted,
    failedFiles: allFailedFiles,
    finalCount,
    iterations: iteration,
    log,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// COUNT & LIST HELPERS (pakai listAllBucketFilePaths agar subfolder ikut)
// ─────────────────────────────────────────────────────────────────────────────

const countBucketFilesStrict = async (bucketName) => {
  const paths = await listAllBucketFilePaths(bucketName);
  return paths.length;
};

// backward compat — dipakai exportFactoryResetBackup
const listBucketFileNames = async (bucketName) => {
  return listAllBucketFilePaths(bucketName);
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fetchAllRows = async (tableName) => {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + TABLE_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Gagal membaca tabel ${tableName}: ${error.message}`);
    }

    const chunk = data || [];
    rows.push(...chunk);
    if (chunk.length < TABLE_PAGE_SIZE) break;
    offset += TABLE_PAGE_SIZE;
  }

  return rows;
};

const emptyTable = async (tableName, onProgress) => {
  let deleted = 0;
  let attemptsWithoutProgress = 0;

  while (true) {
    const { data: rows, error: fetchError } = await supabase
      .from(tableName)
      .select('id')
      .range(0, TABLE_PAGE_SIZE - 1);

    if (fetchError) {
      console.warn(`Gagal membaca data tabel ${tableName}: ${fetchError.message}`);
      break;
    }

    if (!rows || rows.length === 0) {
      break;
    }

    const ids = rows.map((row) => row.id).filter(Boolean);
    if (ids.length === 0) {
      break;
    }

    const { error: deleteError, count } = await supabase
      .from(tableName)
      .delete({ count: 'exact' })
      .in('id', ids);

    if (deleteError) {
      console.warn(`Peringatan: Gagal menghapus data di tabel ${tableName}: ${deleteError.message}`);
      attemptsWithoutProgress += 1;
      if (attemptsWithoutProgress >= 2) break;
    }

    const countDeleted = count != null ? count : ids.length;
    if (countDeleted === 0) {
      attemptsWithoutProgress += 1;
      if (attemptsWithoutProgress >= 2) {
        console.warn(`Peringatan: Deletion stuck pada tabel ${tableName}, menghentikan loop.`);
        break;
      }
    } else {
      attemptsWithoutProgress = 0;
    }

    deleted += countDeleted;
    if (onProgress) {
      onProgress({ tableName, deleted, chunkDeleted: countDeleted });
    }
  }

  return deleted;
};

const clearFrontendCaches = () => {
  clearPublicEventsCache();
  clearEoOrdersCache();

  if (!isBrowser) {
    return;
  }

  localStorage.removeItem('loktik_cached_events');
  sessionStorage.removeItem('loktik_active_checkout');

  const sessionKeys = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key && key.startsWith('gate_auth_')) {
      sessionKeys.push(key);
    }
  }

  sessionKeys.forEach((key) => sessionStorage.removeItem(key));
};

const writeAuditLog = (entry) => {
  if (!isBrowser) {
    return;
  }

  const storageKey = 'loktik_factory_reset_audit_log';
  let current = [];

  try {
    current = JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (error) {
    current = [];
  }

  current.unshift(entry);
  localStorage.setItem(storageKey, JSON.stringify(current.slice(0, 25)));
};

const buildCountsForPlan = async (plan) => {
  const summary = {
    orders: 0,
    tickets: 0,
    events: 0,
    staff: 0,
    paymentProof: 0,
    storage: 0,
  };

  const storageByBucket = {};

  for (const table of plan.tables) {
    const count = await countRowsStrict(table.key);
    if (table.key === 'orders') summary.orders = count;
    if (table.key === 'tickets') summary.tickets = count;
    if (table.key === 'events') summary.events = count;
    if (table.key === 'staff_accounts') summary.staff = count;
  }

  for (const bucket of plan.buckets) {
    const count = await countBucketFilesStrict(bucket.key);
    storageByBucket[bucket.key] = count;
    summary.storage += count;
    if (bucket.key === 'payment-proofs') {
      summary.paymentProof = count;
    }
  }

  return { summary, storageByBucket };
};

const verifyResetState = async (plan, storageResults = {}) => {
  const residue = { tables: [], buckets: [] };

  for (const table of plan.tables) {
    const remaining = await countRowsStrict(table.key);
    if (remaining > 0) {
      residue.tables.push({ key: table.key, remaining });
    }
  }

  for (const bucket of plan.buckets) {
    // Gunakan finalCount dari storageResults jika tersedia (sudah ter-requery)
    // fallback ke query ulang jika tidak ada
    let remaining;
    if (storageResults[bucket.key] !== undefined) {
      remaining = storageResults[bucket.key].finalCount;
    } else {
      remaining = await countBucketFilesStrict(bucket.key);
    }

    const failedFiles = storageResults[bucket.key]?.failedFiles || [];

    if (remaining > 0 || failedFiles.length > 0) {
      residue.buckets.push({
        key: bucket.key,
        remaining: remaining >= 0 ? remaining : '(tidak dapat diverifikasi)',
        failedFiles: failedFiles.slice(0, 10), // max 10 untuk report
        failedFilesTotal: failedFiles.length,
      });
    }
  }

  if (residue.tables.length > 0 || residue.buckets.length > 0) {
    const tableText = residue.tables
      .map((item) => `${item.key}:${item.remaining} row`)
      .join(', ');
    const bucketText = residue.buckets
      .map((item) =>
        `${item.key}:${item.remaining} file` +
        (item.failedFilesTotal > 0 ? ` (${item.failedFilesTotal} gagal dihapus)` : '')
      )
      .join(', ');

    const err = new Error(
      `Verifikasi GAGAL — masih ada sisa data. Tables: [${tableText || '-'}] | Buckets: [${bucketText || '-'}]`
    );
    err.residue = residue;
    throw err;
  }

  return true;
};

export const factoryResetDryRun = async (mode = RESET_MODES.quick) => {
  const plan = getResetPlan(mode);
  const { summary, storageByBucket } = await buildCountsForPlan(plan);

  return {
    mode,
    plan: {
      label: plan.label,
      description: plan.description,
      tables: plan.tables,
      buckets: plan.buckets,
    },
    summary,
    storageByBucket,
    timestamp: new Date().toISOString(),
  };
};

export const exportFactoryResetBackup = async (mode = RESET_MODES.quick) => {
  const plan = getResetPlan(mode);
  const tables = {};
  const storage = {};

  for (const table of plan.tables) {
    tables[table.key] = await fetchAllRows(table.key);
  }

  for (const bucket of plan.buckets) {
    storage[bucket.key] = await listBucketFileNames(bucket.key);
  }

  return {
    mode,
    generatedAt: new Date().toISOString(),
    tables,
    storage,
  };
};

/**
 * Factory Reset Database
 * @param {Object} options
 * @param {'quick'|'factory'} options.mode
 * @param {string} options.actorName
 * @param {string} options.actorRole
 * @param {(payload: Object) => void} options.onProgress
 */
export const factoryResetDatabase = async ({
  mode = RESET_MODES.quick,
  actorName = 'Unknown',
  actorRole = 'admin',
  onProgress,
} = {}) => {
  const plan = getResetPlan(mode);
  const startedAtMs = Date.now();
  const dryRun = await factoryResetDryRun(mode);

  const report = {
    mode,
    modeLabel: plan.label,
    modeDescription: plan.description,
    actorName,
    actorRole,
    startedAt: new Date(startedAtMs).toISOString(),
    durationMs: 0,
    summaryBefore: dryRun.summary,
    deleted: {
      tables: {},
      storage: {},
    },
    storageByBucketBefore: dryRun.storageByBucket,
    status: 'running',
    failedPhase: null,
    errorMessage: null,
  };

  const emitProgress = (phase, detail) => {
    if (onProgress) {
      onProgress({
        phase,
        detail,
        mode,
        summaryBefore: dryRun.summary,
      });
    }
  };

  try {
    emitProgress('dry-run', 'Dry run selesai');

    // ── Storage cleanup ───────────────────────────────────────────────────
    const storageResults = {};

    for (const bucket of plan.buckets) {
      emitProgress('storage', `Menghapus Storage: ${bucket.label}`);

      const result = await emptyBucket(bucket.key, (payload) => {
        if (onProgress) {
          onProgress({
            phase: 'storage',
            detail: `Menghapus Storage: ${bucket.label}`,
            bucket: bucket.key,
            ...payload,
          });
        }
      });

      storageResults[bucket.key] = result;

      // Simpan detail lengkap ke report
      report.deleted.storage[bucket.key] = {
        deleted: result.deleted,
        finalCount: result.finalCount,
        failedFiles: result.failedFiles,
        iterations: result.iterations,
        log: result.log,
      };

      // Emit log per bucket selesai
      emitProgress(
        'storage',
        `[${bucket.label}] selesai: ${result.deleted} terhapus, ${result.failedFiles.length} gagal, sisa=${result.finalCount}, iterasi=${result.iterations}`
      );
    }

    for (const table of plan.tables) {
      emitProgress('database', `Menghapus ${table.label}`);
      const deleted = await emptyTable(table.key, (payload) => {
        if (onProgress) {
          onProgress({
            phase: 'database',
            detail: `Menghapus ${table.label}`,
            table: table.key,
            deleted: payload.deleted,
          });
        }
      });
      report.deleted.tables[table.key] = deleted;
    }

    emitProgress('verify', 'Memverifikasi hasil reset');
    await verifyResetState(plan, storageResults);

    clearFrontendCaches();

    const finishedAtMs = Date.now();
    report.finishedAt = new Date(finishedAtMs).toISOString();
    report.durationMs = finishedAtMs - startedAtMs;
    report.status = 'success';
    report.failedPhase = null;
    report.errorMessage = null;

    writeAuditLog({
      actorName,
      actorRole,
      mode,
      modeLabel: plan.label,
      startedAt: report.startedAt,
      finishedAt: report.finishedAt,
      durationMs: report.durationMs,
      status: 'success',
      summaryBefore: report.summaryBefore,
      deleted: report.deleted,
      storageDetail: Object.fromEntries(
        Object.entries(storageResults).map(([k, v]) => [
          k,
          {
            deleted: v.deleted,
            finalCount: v.finalCount,
            iterations: v.iterations,
            failedFilesTotal: v.failedFiles.length,
          },
        ])
      ),
    });

    return {
      success: true,
      report,
    };
  } catch (error) {
    const finishedAtMs = Date.now();
    report.finishedAt = new Date(finishedAtMs).toISOString();
    report.durationMs = finishedAtMs - startedAtMs;
    report.status = 'failed';
    report.failedPhase = error.phase || null;
    report.errorMessage = error.message;

    writeAuditLog({
      actorName,
      actorRole,
      mode,
      modeLabel: plan.label,
      startedAt: report.startedAt,
      finishedAt: report.finishedAt,
      durationMs: report.durationMs,
      status: 'failed',
      failedPhase: report.failedPhase,
      errorMessage: report.errorMessage,
      summaryBefore: report.summaryBefore,
      deleted: report.deleted,
    });

    const wrappedError = new Error(error.message || 'Factory reset gagal');
    wrappedError.report = report;
    throw wrappedError;
  }
};

export const getFactoryResetAuditLog = () => {
  if (!isBrowser) {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem('loktik_factory_reset_audit_log') || '[]');
  } catch (error) {
    return [];
  }
};

export const downloadBackupFile = (backupData) => {
  if (!isBrowser || !backupData) return;
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `loktik_backup_${backupData.mode || 'export'}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadAuditLogFile = (auditLogData) => {
  if (!isBrowser || !auditLogData) return;
  const jsonStr = JSON.stringify(auditLogData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `loktik_reset_audit_log_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const topUpEoWaQuotaInDb = async (eoId, quotaAmount) => {
  if (!eoId) return { success: false, message: 'EO ID required' };
  try {
    const { data, error } = await supabase.rpc('top_up_wa_quota', {
      target_eo_id: eoId,
      quota_amount: parseInt(quotaAmount, 10) || 0,
    });
    if (error) throw error;
    const res = Array.isArray(data) ? data[0] : data;
    return {
      success: res?.success ?? true,
      newQuota: res?.new_quota ?? 0,
      message: res?.message || 'Top-up kuota berhasil',
    };
  } catch (err) {
    console.error('topUpEoWaQuotaInDb error:', err);
    return { success: false, message: err.message };
  }
};

export { RESET_MODES };
