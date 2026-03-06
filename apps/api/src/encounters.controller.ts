import {
  BadRequestException,
  Controller,
  HttpException,
  Post,
  Body,
} from '@nestjs/common';
import {
  createEncounter,
  EncounterServiceError,
  type EncounterInput,
} from './services/encounterService';

type ValidationResult =
  | { ok: true; data: EncounterInput }
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
  const locationId = toNonEmptyString(body.locationId);
  const takenByUserId = toNonEmptyString(body.takenByUserId);
  const itemsValue = body.items;
  const observationRaw = body.observation;

  if (!isRecord(personValue)) {
    return { ok: false, message: 'person is required' };
  }

  if (!locationId) {
    return { ok: false, message: 'locationId is required' };
  }

  if (!takenByUserId) {
    return { ok: false, message: 'takenByUserId is required' };
  }

  if (!Array.isArray(itemsValue) || itemsValue.length === 0) {
    return { ok: false, message: 'items must be a non-empty array' };
  }

  const parsedItems: Array<{ description: string; quantity: number }> = [];

  for (const item of itemsValue) {
    if (!isRecord(item)) {
      return { ok: false, message: 'each item must be an object' };
    }

    const description = toNonEmptyString(item.description);
    const quantity = item.quantity;

    if (!description) {
      return { ok: false, message: 'item description is required' };
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return { ok: false, message: 'item quantity must be a positive integer' };
    }

    parsedItems.push({ description, quantity });
  }

  const personId = toNonEmptyString(personValue.id);
  const displayName = toNonEmptyString(personValue.displayName) ?? undefined;
  const alias = toNonEmptyString(personValue.alias) ?? undefined;

  if (!personId && !displayName) {
    return {
      ok: false,
      message: 'person.displayName is required when person.id is not provided',
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
      takenByUserId,
      items: parsedItems,
      observation,
    },
  };
}

@Controller()
export class EncountersController {
  @Post('encounters')
  async createEncounter(@Body() body: unknown) {
    const validation = validateEncounterBody(body);
    if (validation.ok === false) {
      throw new BadRequestException(validation.message);
    }

    try {
      return await createEncounter(validation.data);
    } catch (error) {
      if (error instanceof EncounterServiceError) {
        throw new HttpException(error.message, error.statusCode);
      }

      throw error;
    }
  }
}
