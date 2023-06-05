import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  validateRequest,
  NotFoundError,
  requireAuth,
  NotAuthorizedError,
  BadRequestError,
} from '@iceydc-projects/shop-common';
import { Product } from '../models/product';
import { ProductUpdatedPublisher } from '../events/publishers/product-updated-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put(
  '/api/products/:id',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be provided and must be greater than 0'),
    body('description')
      .not()
      .isEmpty()
      .withMessage('Description is required')
      .isString()
      .withMessage('Description must be of type string'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new NotFoundError();
    }

    if (product.orderId) {
      throw new BadRequestError('Cannot edit an ordered product');
    }

    // Make sure the user who updates the product owns it first
    if (product.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    // Set method only makes changes to the document in the memory, does not persist in DB
    product.set({
      title: req.body.title,
      price: req.body.price,
      description: req.body.description,
    });
    await product.save();

    new ProductUpdatedPublisher(natsWrapper.client).publish({
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      userId: product.userId,
      version: product.version,
    });

    res.send(product);
  }
);

export { router as updateProductRouter };
