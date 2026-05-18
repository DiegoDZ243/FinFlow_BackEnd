import { check } from 'k6';

export function checkNot5xx(res, name) {
  check(res, {
    [name]: (r) => r.status < 500,
  });
}

export function checkUnauthorized(res, name) {
  check(res, {
    [name]: (r) => r.status === 401,
  });
}

export function checkForbidden(res, name) {
  check(res, {
    [name]: (r) => r.status === 403,
  });
}
