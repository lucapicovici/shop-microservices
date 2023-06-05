import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { natsWrapper } from '../../nats-wrapper';
import { Product } from '../../models/product';

it('returns a 404 if the provided ID does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/products/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'asdf',
      price: 20,
      description: 'Lorem ipsum',
    })
    .expect(404);
});

it('returns a 401 if the user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/products/${id}`)
    .send({
      title: 'asdf',
      price: 20,
      description: 'Lorem ipsum',
    })
    .expect(401);
});

it('returns a 401 if the user does not own the product', async () => {
  const response = await request(app)
    .post('/api/products')
    .set('Cookie', global.signin())
    .send({
      title: 'asdf',
      price: 20,
      description: 'Lorem ipsum',
    });

  await request(app)
    .put(`/api/products/${response.body.id}`)
    .set('Cookie', global.signin())
    .send({
      title: '3fasdf',
      price: 1000,
      description: 'Changed description',
    })
    .expect(401);
});

it('returns a 400 if the user provides an invalid title or price or description', async () => {
  // Save the reference to cookie for making requests from the same user
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/products')
    .set('Cookie', cookie)
    .send({
      title: 'asdf',
      price: 20,
      description: 'Lorem ipsum',
    });

  await request(app)
    .put(`/api/products/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: 20,
      description: 'Lorem ipsum',
    })
    .expect(400);

  await request(app)
    .put(`/api/products/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'asdffdsa',
      price: -10,
      description: 'Lorem ipsum',
    })
    .expect(400);

  await request(app)
    .put(`/api/products/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'asdffdsa',
      price: 10,
      description: '',
    })
    .expect(400);

  await request(app)
    .put(`/api/products/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'asdffdsa',
      price: 10,
      description: 0,
    })
    .expect(400);
});

it('updates the product provided valid inputs', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/products')
    .set('Cookie', cookie)
    .send({
      title: 'asdf',
      price: 20,
      description: 'Lorem ipsum',
    });

  await request(app)
    .put(`/api/products/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'new title',
      price: 100,
      description: 'Changed description',
    })
    .expect(200);

  const productResponse = await request(app)
    .get(`/api/products/${response.body.id}`)
    .send();

  expect(productResponse.body.title).toEqual('new title');
  expect(productResponse.body.price).toEqual(100);
  expect(productResponse.body.description).toEqual('Changed description');
});

it('publishes an event', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/products')
    .set('Cookie', cookie)
    .send({
      title: 'asdf',
      price: 20,
      description: 'Lorem ipsum',
    });

  await request(app)
    .put(`/api/products/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'new title',
      price: 100,
      description: 'Lorem',
    })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('rejects updates if the product has been ordered', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/products')
    .set('Cookie', cookie)
    .send({
      title: 'asdf',
      price: 20,
      description: 'Lorem ipsum',
    });

  const product = await Product.findById(response.body.id);
  product!.set({ orderId: new mongoose.Types.ObjectId().toHexString() });
  await product!.save();

  await request(app)
    .put(`/api/products/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'new title',
      price: 100,
      description: 'Changed description',
    })
    .expect(400);
});
