import { describe, expect, it } from 'vitest';
import { extractApiMessage, extractAxiosErrorMessage, normalizeReportLevel, normalizeRoleName, unwrapApiData } from './responseUtils';

describe('responseUtils', () => {
  it('unwraps data from ApiResponse envelope', () => {
    const payload = { code: 200, message: 'OK', data: [{ id: 1 }] };
    const data = unwrapApiData<Array<{ id: number }>>(payload);

    expect(data).toEqual([{ id: 1 }]);
  });

  it('returns raw payload when response is not wrapped', () => {
    const payload = [{ id: 1 }, { id: 2 }];
    const data = unwrapApiData<Array<{ id: number }>>(payload);

    expect(data).toEqual(payload);
  });

  it('extracts message from root and nested fields', () => {
    expect(extractApiMessage({ message: 'Root message' }, 'fallback')).toBe('Root message');
    expect(extractApiMessage({ data: { message: 'Nested message' } }, 'fallback')).toBe('Nested message');
    expect(extractApiMessage({}, 'fallback')).toBe('fallback');
  });

  it('extracts axios error messages with status code', () => {
    const error = {
      response: {
        status: 400,
        data: {
          message: 'Rating must be between 1 and 5',
        },
      },
    };

    expect(extractAxiosErrorMessage(error, 'fallback')).toBe('Rating must be between 1 and 5 (HTTP 400)');
  });

  it('normalizes role and report levels', () => {
    expect(normalizeRoleName('ROLE_ADMIN')).toBe('ADMIN');
    expect(normalizeRoleName('leader')).toBe('LEADER');
    expect(normalizeRoleName('unknown')).toBe('CITIZEN');

    expect(normalizeReportLevel('VILLAGE')).toBe('AT_VILLAGE');
    expect(normalizeReportLevel('district_mayor')).toBe('AT_DISTRICT');
    expect(normalizeReportLevel('AT_DISTRICT')).toBe('AT_DISTRICT');
    expect(normalizeReportLevel('national')).toBe('AT_NATIONAL');
  });
});

