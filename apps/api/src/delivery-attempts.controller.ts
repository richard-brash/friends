import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  Post,
} from '@nestjs/common';
import { DeliveryOutcome } from '@prisma/client';
import {
  createDeliveryAttempt,
  DeliveryAttemptServiceError,
  type CreateDeliveryAttemptInput,
} from './services/deliveryAttemptService';

type ValidationResult =
  | { ok: true; data: CreateDeliveryAttemptInput }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOutcome(value: unknown): DeliveryOutcome | null {
  const normalized = toNonEmptyString(value)?.toUpperCase();
  if (!normalized) {
    return null;
  }

  return Object.values(DeliveryOutcome).includes(normalized as DeliveryOutcome)
    ? (normalized as DeliveryOutcome)
    : null;
}

function validateDeliveryAttemptBody(body: unknown): ValidationResult {
  if (!isRecord(body)) {
    return { ok: false, message: 'Request body must be a JSON object' };
  }

  const requestItemId = toNonEmptyString(body.requestItemId);
  const outcome = parseOutcome(body.outcome);
  const notes = toNonEmptyString(body.notes) ?? undefined;

  if (!requestItemId) {
    return { ok: false, message: 'requestItemId is required' };
  }

  if (!outcome) {
    return {
      ok: false,
      message:
        'outcome must be one of DELIVERED, PERSON_NOT_FOUND, DECLINED, LOCATION_EMPTY',
    };
  }

  return {
    ok: true,
    data: {
      requestItemId,
      outcome,
      notes,
    },
  };
}

@Controller()
export class DeliveryAttemptsController {
  @Post('delivery-attempts')
  async createDeliveryAttempt(@Body() body: unknown) {
    const validation = validateDeliveryAttemptBody(body);
    if (validation.ok === false) {
      throw new BadRequestException(validation.message);
    }

    try {
      await createDeliveryAttempt(validation.data);
      return { success: true };
    } catch (error) {
      if (error instanceof DeliveryAttemptServiceError) {
        throw new HttpException(error.message, error.statusCode);
      }

      throw error;
    }
  }
}
