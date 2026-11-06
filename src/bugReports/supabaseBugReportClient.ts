import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudConfig } from '../persistence/cloud/cloudConfig';
import type { Database, Json } from '../persistence/cloud/database.types';
import { loadSharedSupabase } from '../persistence/cloud/sharedSupabase';
import { parseSummaries, parseThread } from './parse';
import { BugReportError, type BugReportClient, type BugReportErrorKind, type BugReportSubmission, type BugReportSummary, type BugReportThread } from './types';

interface PostgrestFailure {
  message: string;
  details?: string | null;
  code?: string;
}

const MESSAGE_KINDS: ReadonlyArray<readonly [string, BugReportErrorKind]> = [
  ['urb_unauthenticated', 'unauthenticated'],
  ['urb_email_required', 'email-required'],
  ['urb_rate_limited', 'rate-limited'],
  ['urb_report_invalid', 'invalid'],
  ['urb_reply_invalid', 'invalid'],
  ['urb_report_not_found', 'not-found'],
  ['urb_report_closed', 'closed'],
];

export function toBugReportError(failure: PostgrestFailure): BugReportError {
  const known = MESSAGE_KINDS.find(([marker]) => failure.message.includes(marker));
  if (known) return new BugReportError(known[1], known[1] === 'rate-limited' ? retryAfter(failure) : null);
  if (failure.code === '28000' || failure.code === '42501') return new BugReportError('unauthenticated');
  if (failure.code === '23514') return new BugReportError('invalid');
  if (/fetch|network|load failed/i.test(failure.message) || failure.code === '') return new BugReportError('offline');
  return new BugReportError('unknown');
}

function retryAfter(failure: PostgrestFailure): number | null {
  const seconds = Number(failure.details);
  return failure.details && Number.isFinite(seconds) ? seconds : null;
}

export async function createSupabaseBugReportClient(config: CloudConfig): Promise<BugReportClient> {
  const { client } = await loadSharedSupabase(config);
  return new SupabaseBugReportClient(client);
}

class SupabaseBugReportClient implements BugReportClient {
  constructor(private client: SupabaseClient<Database>) {}

  async send(report: BugReportSubmission): Promise<number> {
    const id = await this.call(() =>
      this.client.rpc('urb_send_bug_report', {
        p_description: report.description,
        p_camera: report.camera as Json,
        p_context: report.context as Json,
        p_city_id: report.cityId as string,
        p_city_seed: report.citySeed as string,
        p_screenshot: report.screenshot as string,
        p_city_json: (report.city?.kind === 'json' ? report.city.value : null) as Json,
        p_city_gzip: (report.city?.kind === 'gzip' ? report.city.base64 : null) as string,
      }),
    );
    if (id === null) throw new BugReportError('unknown');
    return id;
  }

  async list(): Promise<BugReportSummary[]> {
    return parseSummaries(await this.call(() => this.client.rpc('urb_list_bug_reports')));
  }

  async get(id: number): Promise<BugReportThread> {
    const thread = parseThread(await this.call(() => this.client.rpc('urb_get_bug_report', { p_id: id })));
    if (!thread) throw new BugReportError('unknown');
    return thread;
  }

  async reply(id: number, body: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_reply_to_bug_report', { p_id: id, p_body: body }));
  }

  private async call<T>(request: () => PromiseLike<{ data: T; error: PostgrestFailure | null }>): Promise<T> {
    try {
      const { data, error } = await request();
      if (error) throw toBugReportError(error);
      return data;
    } catch (error) {
      if (error instanceof BugReportError) throw error;
      throw new BugReportError('offline');
    }
  }
}
