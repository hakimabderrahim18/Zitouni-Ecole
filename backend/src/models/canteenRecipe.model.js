const mongoose = require('mongoose');

const canteenRecipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['lunch', 'breakfast', 'snack', 'dessert'],
      default: 'lunch',
    },
    dayOfWeek: {
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'All'],
      default: 'Sunday',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    ingredients: [
      {
        type: String,
        trim: true,
      },
    ],
    calories: {
      type: Number,
      default: 450,
    },
    allergens: [
      {
        type: String,
        trim: true,
      },
    ],
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
    mealCount: {
      type: Number,
      default: 60,
    },
    price: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['available', 'delivered', 'archived'],
      default: 'available',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

canteenRecipeSchema.index({ dayOfWeek: 1, isDelivered: 1 });
canteenRecipeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CanteenRecipe', canteenRecipeSchema);
