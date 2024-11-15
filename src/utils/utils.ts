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
