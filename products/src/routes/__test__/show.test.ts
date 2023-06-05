import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

it('returns a 404 if the product is not found', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app).get(`/api/products/${id}`).send().expect(404);
});

it('returns the product if the product is found', async () => {
  const title = 'concert';
  const price = 20;
  const description = 'Lorem ipsum';

  // Create a product by making a post request to the new route
  const response = await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title,
      price,
      description,
    })
    .expect(201);

  const productResponse = await request(app)
    .get(`/api/products/${response.body.id}`)
    .send()
    .expect(200);

  expect(productResponse.body.title).toEqual(title);
  expect(productResponse.body.price).toEqual(price);
  expect(productResponse.body.description).toEqual(description);
});
