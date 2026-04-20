/// <reference types="vitest" />
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './axios';
import { confirmReport, createReport, denyReport, getMyJurisdictionReports } from './reportApi';

vi.mock('./axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    },
  };
});

type MockedApi = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

const mockedApi = api as unknown as MockedApi;

describe('reportApi', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
  });

  it('posts report payload using IDs only', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: 10 } });

    await createReport({
      title: 'Broken water pipe',
      description: 'Leak near school',
      categoryId: 1,
      villageId: 200,
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/reports', {
      title: 'Broken water pipe',
      description: 'Leak near school',
      categoryId: 1,
      villageId: 200,
    });
  });

  it('uses /leader/reports as primary endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: [{ id: 1, title: 'Issue', status: 'PENDING' }],
    });

    const data = await getMyJurisdictionReports();

    expect(mockedApi.get).toHaveBeenCalledWith('/leader/reports');
    expect(data).toHaveLength(1);
  });

  it('falls back to legacy and level endpoint when leader endpoint fails', async () => {
    mockedApi.get
      .mockRejectedValueOnce(new Error('Primary failed'))
      .mockRejectedValueOnce(new Error('Legacy failed'))
      .mockResolvedValueOnce({ data: [{ id: 4, title: 'Escalated issue', status: 'PENDING' }] });

    const data = await getMyJurisdictionReports('VILLAGE');

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/leader/reports');
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/reports/leader/my-jurisdiction');
    expect(mockedApi.get).toHaveBeenNthCalledWith(3, '/reports/level/AT_VILLAGE');
    expect(data).toHaveLength(1);
  });

  it('sends confirmation payload for approve/reject flow', async () => {
    mockedApi.put.mockResolvedValue({ data: { success: true } });

    await confirmReport(7, { approved: true, rating: 5, comment: 'Great service' });
    await denyReport(8);

    expect(mockedApi.put).toHaveBeenNthCalledWith(1, '/reports/7/confirm', {
      approved: true,
      rating: 5,
      comment: 'Great service',
    });
    expect(mockedApi.put).toHaveBeenNthCalledWith(2, '/reports/8/confirm', {
      approved: false,
    });
  });
});

