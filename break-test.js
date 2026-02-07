import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, 
    { duration: '1m', target: 300 }, 
    { duration: '1m', target: 500 }, // The "Aggressive" push
    { duration: '1m', target: 1000 }, // Let's see if we can hit 1000
    { duration: '30s', target: 0 },
  ],
};

const BASE_URL = 'http://host.docker.internal:3001/api';

export default function () {
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // We only hit the most expensive route (POST with DB write) 
  // to break the CPU as fast as possible.
  const res = http.post(`${BASE_URL}/quiz/start`, JSON.stringify({
    topic_id: '237ba0b8-1dcc-422b-b80d-2a1c03353af6',
    student_session_id: `breaker_${__VU}_${__ITER}`,
    student_nickname: 'Breaker'
  }), params);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'status is 500': (r) => r.status === 500,
  });
  
  // NO SLEEP - Continuous hammering
}
