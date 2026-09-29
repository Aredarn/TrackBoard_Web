import { gap, gpsLabel, initials, lapTime, plural, problemMessage } from './format';

describe('lapTime', () => {
  it('prints sub-minute laps as seconds with thousandths', () => {
    expect(lapTime(41910)).toBe('41.910');
    expect(lapTime(9005)).toBe('9.005');
  });

  it('prints longer laps as m:ss.sss', () => {
    expect(lapTime(92345)).toBe('1:32.345');
    expect(lapTime(127010)).toBe('2:07.010');
    expect(lapTime(60000)).toBe('1:00.000');
  });

  it('prints a dash for a missing time', () => {
    expect(lapTime(null)).toBe('—');
    expect(lapTime(undefined)).toBe('—');
  });
});

describe('gap', () => {
  it('is empty for the reference itself', () => {
    expect(gap(0)).toBeNull();
    expect(gap(null)).toBeNull();
  });

  it('signs the difference', () => {
    expect(gap(291)).toBe('+0.291');
    expect(gap(-120)).toBe('−0.120');
    expect(gap(62100)).toBe('+1:02.100');
  });
});

describe('labels', () => {
  it('names the rig that timed a lap', () => {
    expect(gpsLabel('Wifi')).toBe('ESP32 · Wi-Fi');
    expect(gpsLabel('PhoneGps')).toBe('Phone GPS');
  });

  it('takes initials from the first and last word', () => {
    expect(initials('Martin M.')).toBe('MM');
    expect(initials('Aredarn')).toBe('AR');
  });

  it('pluralises counts', () => {
    expect(plural(1, 'driver')).toBe('1 driver');
    expect(plural(6, 'driver')).toBe('6 drivers');
  });
});

describe('problemMessage', () => {
  it('prefers the first field error from a ProblemDetails body', () => {
    const e = { status: 400, error: { title: 'Bad', errors: { Password: ['Passwords must be at least 12 characters.'] } } };
    expect(problemMessage(e)).toBe('Passwords must be at least 12 characters.');
  });

  it('explains an unreachable server and rate limiting', () => {
    expect(problemMessage({ status: 0 })).toContain('Could not reach');
    expect(problemMessage({ status: 429 })).toContain('Too many attempts');
  });
});
