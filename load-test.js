import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users (Load Test)
    { duration: '1m', target: 200 }, // Ramp up to 200 users (Stress Test)
    { duration: '2m', target: 200 }, // Stay at 200 users
    { duration: '1m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

const BASE_URL = 'http://host.docker.internal:3001/api';

export default function () {
  // 1. Fetch Chapters
  const chaptersRes = http.get(`${BASE_URL}/chapters`);
  check(chaptersRes, {
    'chapters status is 200': (r) => r.status === 200,
  });

  const chapters = chaptersRes.json();
  if (chapters && chapters.length > 0) {
    const chapterId = chapters[0].id;

    // 2. Fetch Topics for a chapter
    const topicsRes = http.get(`${BASE_URL}/topics?chapter_id=${chapterId}`);
    check(topicsRes, {
      'topics status is 200': (r) => r.status === 200,
    });

    const topics = topicsRes.json();
    if (topics && topics.length > 0) {
      const topicId = topics[0].id;

      // 3. Start a Quiz Session (Simulates a write operation)
      const payload = JSON.stringify({
        topic_id: topicId,
        student_session_id: `test_user_${__VU}_${__ITER}`,
        student_nickname: 'StressTester'
      });

      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const startRes = http.post(`${BASE_URL}/quiz/start`, payload, params);
      check(startRes, {
        'start quiz status is 201': (r) => r.status === 201,
      });
    }
  }

  sleep(Math.random() * 3 + 1); // Think time: wait 1-4 seconds between actions
}
