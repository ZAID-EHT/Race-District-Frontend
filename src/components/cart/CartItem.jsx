import React from 'react';
import { useCart } from '../../hooks/useCart';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className="w-20 h-20 bg-gray-800 rounded flex items-center justify-center text-3xl">
        {item.image}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-white">{item.name}</h4>
        <p className="text-rd-blue font-bold">${item.price}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          -
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          +
        </button>
      </div>
      <button
        onClick={() => removeFromCart(item.id)}
        className="text-red-500 hover:text-red-400 p-2"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

export default CartItem;