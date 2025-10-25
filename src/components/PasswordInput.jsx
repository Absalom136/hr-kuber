// E:\Projects\Python\hr-kuber\src\components\PasswordInput.jsx

import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function PasswordInput({ value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mb-4">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Password"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}