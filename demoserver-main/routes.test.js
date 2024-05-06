const request = require('supertest');
const express = require('express');
const route = require('./routes'); 

const app = express();
app.use(express.json());
app.use('/api', route);

describe('Authentication routes', () => {
  it('should sign up a user', async () => {
    const response = await request(app)
      .post('/api/app/signup')
      .send({
        username: 'testuser1',
        email:'test2@gmail.com',
        password: 'testpassword',
        firstName:'Test',
        lastName:'Jest',
        gender:'male',
        mobile:'123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should log in a user', async () => {

    const response = await request(app)
      .post('/api/app/login')
      .send({
        username: 'testuser',
        password: 'testpassword',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

});
