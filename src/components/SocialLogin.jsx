
export default function SocialLogin() {
  return (
    <div className="flex justify-center gap-4 mt-6">
      {/* Google */}
      <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:shadow-md transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
          <path fill="#fbc02d" d="M43.6 20.4h-1.8V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 7.1 29.4 5 24 5 12.4 5 3 14.4 3 26s9.4 21 21 21c10.5 0 19.5-7.6 21-18v-8.6z"/>
          <path fill="#e53935" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 7.1 29.4 5 24 5c-7.4 0-13.7 3.6-17.7 9.2z"/>
          <path fill="#4caf50" d="M24 47c5.4 0 10.3-2.1 14-5.5l-6.5-5.3c-2.1 1.5-4.7 2.3-7.5 2.3-5.3 0-9.7-3.4-11.3-8H6.3C8.3 40.6 15.5 47 24 47z"/>
          <path fill="#1565c0" d="M43.6 20.4h-1.8V20H24v8h11.3c-.9 2.6-2.6 4.8-4.8 6.3l6.5 5.3c4.2-3.9 6.6-9.6 6.6-15.6 0-1.1-.1-2.2-.2-3.3z"/>
        </svg>
      </button>

      {/* Facebook */}
      <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:shadow-md transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
          <path fill="#3b5998" d="M24 4C12.95 4 4 12.95 4 24c0 9.9 7.2 18.1 16.6 19.7V30.9h-5v-6.9h5v-5.3c0-5 3-7.8 7.6-7.8 2.2 0 4.5.4 4.5.4v5h-2.5c-2.5 0-3.3 1.6-3.3 3.2v3.5h5.6l-.9 6.9h-4.7v12.8C36.8 42.1 44 33.9 44 24c0-11.05-8.95-20-20-20z"/>
        </svg>
      </button>
    </div>
  );
}