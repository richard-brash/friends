import {
  BadRequestException,
  Controller,
  HttpException,
  Post,
  Body,
} from '@nestjs/common';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { RequestContext } from './common/types/request-context';
import {
  createEncounter,
  EncounterServiceError,
  type EncounterInput,
} from './services/encounterService';

type ValidationResult =
  | { ok: true; data: Omit<EncounterInput, 'takenByUserId'> }
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

function validateEncounterBody(body: unknown): ValidationResult {
  if (!isRecord(body)) {
    return { ok: false, message: 'Request body must be a JSON object' };
  }

  const personValue = body.person;
  const friendIdRaw = body.friendId ?? body.friend_id;
  const friendPreferredNameRaw = body.preferredName ?? body.preferred_name;
  const locationId = toNonEmptyString(body.locationId);
  const itemsValue = Array.isArray(body.items) ? body.items : body.needs;
  const observationRaw = body.observation ?? body.notes;

  if (!locationId) {
    return { ok: false, message: 'locationId is required' };
  }

  if (!Array.isArray(itemsValue) || itemsValue.length === 0) {
    return { ok: false, message: 'items must be a non-empty array' };
  }

  const parsedItems: Array<{ description: string; quantity: number }> = [];

  for (const item of itemsValue) {
    if (!isRecord(item)) {
      return { ok: false, message: 'each item must be an object' };
    }

    const description = toNonEmptyString(item.description ?? item.label);
    const quantity = item.quantity;

    if (!description) {
      return { ok: false, message: 'item description is required' };
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return { ok: false, message: 'item quantity must be a positive integer' };
    }

    parsedItems.push({ description, quantity });
  }

  const personId = toNonEmptyString(friendIdRaw) ?? (isRecord(personValue) ? toNonEmptyString(personValue.id) : null);
  const displayName =
    toNonEmptyString(friendPreferredNameRaw) ??
    (isRecord(personValue) ? toNonEmptyString(personValue.displayName) : null) ??
    undefined;
  const alias = isRecord(personValue) ? toNonEmptyString(personValue.alias) ?? undefined : undefined;

  if (!personId && !displayName) {
    return {
      ok: false,
      message: 'friendId is required unless preferredName is provided',
    };
  }

  const observation = toNonEmptyString(observationRaw) ?? undefined;

  return {
    ok: true,
    data: {
      person: {
        id: personId ?? undefined,
        displayName,
        alias,
      },
      locationId,
      items: parsedItems,
      observation,
    },
  };
}

@Controller()
export class EncountersController {
  @Post('encounters')
  async createEncounter(
    @Body() body: unknown,
    @CurrentUser() user: RequestContext,
  ) {
    const validation = validateEncounterBody(body);
    if (validation.ok === false) {
      throw new BadRequestException(validation.message);
    }

    try {
      return await createEncounter({
        ...validation.data,
        takenByUserId: user.userId,
      });
    } catch (error) {
      if (error instanceof EncounterServiceError) {
        throw new HttpException(error.message, error.statusCode);
      }

      throw error;
    }
  }
}
