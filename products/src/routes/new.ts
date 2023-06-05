import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { requireAuth, validateRequest } from '@iceydc-projects/shop-common';
import { Product } from '../models/product';
import { ProductCreatedPublisher } from '../events/publishers/product-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/products',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0'),
    body('description')
      .not()
      .isEmpty()
      .withMessage('Description is required')
      .isString()
      .withMessage('Description must be of type string'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { title, price, description } = req.body;

    const product = Product.build({
      title,
      price,
      description,
      userId: req.currentUser!.id,
    });
    await product.save();

    await new ProductCreatedPublisher(natsWrapper.client).publish({
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      userId: product.userId,
      version: product.version,
    });

    res.status(201).send(product);
  }
);

export { router as createProductRouter };
