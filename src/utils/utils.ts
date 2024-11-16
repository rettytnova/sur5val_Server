import lodash from 'lodash';
const { snakeCase } = lodash;

/**
 * 객체의 키를 스네이크케이스로 변환하는 함수
 * @param obj 변환할 객체
 * @returns 키가 스네이크케이스로 변환된 객체
 */
export const toSnakeCase = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    // 배열인 경우, 배열의 각 요소에 대해 재귀적으로 toSnakeCase 호출
    return obj.map((v) => toSnakeCase(v));
  } else if (
    obj !== null &&
    typeof obj === 'object' &&
    obj.constructor === Object
  ) {
    // 객체인 경우, 키를 스네이크케이스로 변환하고 값에 대해 재귀적으로 toSnakeCase 호출
    return Object.keys(obj).reduce<Record<string, unknown>>((result, key) => {
      result[snakeCase(key)] = toSnakeCase(
        (obj as Record<string, unknown>)[key],
      );
      return result;
    }, {});
  }
  // 객체도 배열도 아닌 경우, 원본 값을 반환
  return obj;
};

/**
 * - Date 객체를 'YYYY-MM-DD HH:MM:SS' 형식으로 변환하는 함수
 * @param {Date} time - Date 객체
 * @returns {string} 포맷팅된 시간 문자열
 */
export const timeFormatting = (time: Date): string => {
  return time.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * - 시간을 초 단위로 변환 해주는 함수(매개변수 예시 - '7d', '7h', '7m')
 * @param {string} time - 시간
 * @returns {number} 초 단위의 시간
 */
export const timeConversion = (time: string): number => {
  // 마지막 문자(시간 단위 부분) 추출
  const timeString = time.slice(-1);
  // 시간 문자열을 정수로 변환
  const timeNumber = parseInt(time.slice(0, -1), 10);

  // 시간 단위에 따라 시간 정수를 초 단위의 시간으로 변환
  switch (timeString) {
    case 'd': // Days
      return timeNumber * 86400;
    case 'h': // Hours
      return timeNumber * 3600;
    case 'm': // Minutes
      return timeNumber * 60;
    default: // Seconds
      return timeNumber;
  }
};
