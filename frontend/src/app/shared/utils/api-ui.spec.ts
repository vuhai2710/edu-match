import { LearningRequestStatus } from '../../api/generated/client/models';
import {
  buildEndTime,
  learningRequestStatusLabel,
  notificationRoute,
  validateTimeSlots,
} from './api-ui';

describe('api-ui helpers', () => {
  it('maps backend notification learning request links to guarded student routes', () => {
    expect(
      notificationRoute({
        actionUrl: '/learning-requests/42',
      }),
    ).toBe('/student/learning-requests/42');

    expect(
      notificationRoute({
        referenceType: 'LearningRequest',
        referenceId: 7,
      }),
    ).toBe('/student/learning-requests/7');
  });

  it('validates schedule windows and derived end time', () => {
    expect(buildEndTime('17:00', 2)).toBe('19:00');
    expect(
      validateTimeSlots(
        [{ day: 'Monday', startTime: '17:00', endTime: '19:00' }],
        2,
      ),
    ).toBeNull();
    expect(
      validateTimeSlots(
        [{ day: 'Monday', startTime: '16:30', endTime: '18:30' }],
        2,
      ),
    ).toContain('Ngày thường');
  });

  it('labels learning request statuses', () => {
    expect(learningRequestStatusLabel(LearningRequestStatus.SoftBooked)).toContain('thanh toán');
  });
});
