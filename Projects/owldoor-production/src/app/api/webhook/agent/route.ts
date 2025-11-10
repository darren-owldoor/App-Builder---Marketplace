import { NextResponse, type NextRequest } from 'next/server';

import { createServerClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type AgentInsert = Database['public']['Tables']['agents']['Insert'];

type AgentWebhookPayload = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string | null;
  data?: Record<string, unknown> | null;
};

const REQUIRED_FIELDS: Array<keyof Required<AgentWebhookPayload>> = [
  'first_name',
  'last_name',
  'phone',
];

const validatePayload = (payload: unknown): AgentWebhookPayload => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload: expected JSON object');
  }

  const { first_name, last_name, phone, email = null, data = {} } = payload as AgentWebhookPayload;

  for (const field of REQUIRED_FIELDS) {
    const value = (payload as AgentWebhookPayload)[field];
    if (!value || typeof value !== 'string') {
      throw new Error(`Missing or invalid required field: ${field}`);
    }
  }

  if (email !== null && typeof email !== 'string') {
    throw new Error('Invalid email: must be a string');
  }

  const normalizedData = data && typeof data === 'object' ? data : {};

  return {
    first_name,
    last_name,
    phone,
    email,
    data: normalizedData,
  };
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const payload = validatePayload(body);

    const supabase = createServerClient();

    const insertPayload: AgentInsert = {
      first_name: payload.first_name!,
      last_name: payload.last_name!,
      phone: payload.phone!,
      email: payload.email ?? null,
      data: payload.data ?? {},
    };

    const { error, data } = await supabase
      .from('agents')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, agent: data },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unexpected error processing webhook payload';

    const status = message.startsWith('Missing or invalid') || message.startsWith('Invalid') ? 400 : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status },
    );
  }
};

export const dynamic = 'force-dynamic';
