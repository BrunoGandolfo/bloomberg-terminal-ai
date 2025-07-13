const request = require('supertest');

describe('Sistema Bloomberg Terminal - Smoke Test', () => {
  test('Backend health check', async () => {
    // Verificar que el endpoint de salud responde
    const response = await request('http://localhost:5000')
      .get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
}); 