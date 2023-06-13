import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import {
  requireAuth,
  validateRequest,
  NotFoundError,
  OrderStatus,
  BadRequestError,
} from '@iceydc-projects/shop-common';
import { body } from 'express-validator';
import { Product } from '../models/product';
import { Order } from '../models/order';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 1 * 30;

router.post(
  '/api/orders',
  requireAuth,
  [
    body('productId')
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('productId must be provided'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError();
    }

    const isReserved = await product.isReserved();
    if (isReserved) {
      throw new BadRequestError('Product is already reserved');
    }

    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expiration,
      product,
    });
    await order.save();

    new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      status: order.status,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(),
      product: {
        id: product.id,
        price: product.price,
      },
    });

    res.status(201).send(order);
  }
);

export { router as newOrderRouter };
