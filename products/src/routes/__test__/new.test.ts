import request from 'supertest';
import { app } from '../../app';
import { Product } from '../../models/product';
import { natsWrapper } from '../../nats-wrapper';

it('has a route handler listening to /api/products for post requests', async () => {
  const response = await request(app).post('/api/products').send({});

  expect(response.status).not.toEqual(404);
});

it('can only be accessed if the user is signed in', async () => {
  await request(app).post('/api/products').send({}).expect(401);
});

it('returns a status other than 401 if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({});

  expect(response.status).not.toEqual(401);
});

it('returns an error if an invalid title is provided', async () => {
  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title: '',
      price: 10,
      description: 'Lorem ipsum',
    })
    .expect(400);

  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      price: 10,
      description: 'Lorem ipsum',
    })
    .expect(400);
});

it('returns an error if an invalid price is provided', async () => {
  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title: 'Marshall JCM800',
      price: -10,
      description: '100W Tube Amp Head',
    })
    .expect(400);

  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title: 'Marshall JCM800',
      description: '100W Tube Amp Head',
    })
    .expect(400);
});

it('returns an error if an invalid description is provided', async () => {
  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title: 'asdf',
      price: 10,
      description: '',
    })
    .expect(400);

  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title: 'asdf',
      price: 10,
      description: 0,
    })
    .expect(400);

  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title: 'asdf',
      price: 10,
    })
    .expect(400);
});

it('creates a product with valid inputs', async () => {
  // Add in a check to make sure a product was saved
  let products = await Product.find({});
  expect(products.length).toEqual(0);

  const title = 'asdf';
  const description = 'Lorem ipsum';

  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title,
      price: 20,
      description: 'Lorem ipsum',
    })
    .expect(201);

  products = await Product.find({});
  expect(products.length).toEqual(1);
  expect(products[0].price).toEqual(20);
  expect(products[0].title).toEqual(title);
  expect(products[0].description).toEqual(description);
});

it('publishes an event', async () => {
  const title = 'asdf';
  const description = 'Lorem ipsum';

  await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title,
      price: 20,
      description,
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
