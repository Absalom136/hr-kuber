import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

export default function DarkModeToggle({ fixed = false }) {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className={`p-2 rounded-full shadow hover:scale-105 transition
        ${fixed ? 'fixed top-4 right-4 z-50 bg-white/80 dark:bg-gray-800 text-gray-800 dark:text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'}
      `}
      title="Toggle Dark Mode"
    >
      {dark ? <FaSun /> : <FaMoon />}
    </button>
  );
}