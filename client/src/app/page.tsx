'use client'

import React from "react";
import { signIn } from "next-auth/react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-semibold mb-5 text-center">Welcome to LearniO AI</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8 text-center font-small">
          Your personalized Learning journey starts here. Log in or sign up to continue.
        </p>
        <button
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors mb-4 cursor-pointer transform transition-transform duration-300 hover:scale-103"
          onClick={() => signIn('google')}
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_17_40)">
              <path d="M47.5 24.5C47.5 22.6 47.3 21 47 19.4H24V28.6H37.2C36.6 31.6 34.7 34.1 31.9 35.8V41.1H39.5C44 37.1 47.5 31.4 47.5 24.5Z" fill="#F3F4F6"/>
              <path d="M24 48C30.5 48 35.9 45.9 39.5 41.1L31.9 35.8C30.1 37 27.7 37.8 24 37.8C17.7 37.8 12.3 33.7 10.5 28.2H2.6V33.7C6.2 41.1 14.4 48 24 48Z" fill="#E5E7EB"/>
              <path d="M10.5 28.2C9.9 26.6 9.5 24.9 9.5 23.1C9.5 21.3 9.9 19.6 10.5 18H2.6V12.5C4.9 8.1 10.7 3.9 18.2 3.9C22.2 3.9 25.7 5.3 28.2 7.6L34.1 2.1C30.5 -1.1 25.7 -3 18.2 -3C8.6 -3 0.4 3.9 2.6 12.5L10.5 18C12.3 13.5 17.7 9.4 24 9.4C27.7 9.4 30.1 10.2 31.9 11.4L39.5 6.1C35.9 1.3 30.5 -1 24 -1C14.4 -1 6.2 6.1 2.6 13.5L10.5 18Z" fill="#F9FAFB"/>
            </g>
            <defs>
              <clipPath id="clip0_17_40">
                <rect width="48" height="48" fill="white" />
              </clipPath>
            </defs>
          </svg>
          Sign in with Google
        </button>
        <p className="text-xs text-slate-500 text-center mt-2">
          By signing up, you agree to our{' '}
          <a href="#" className="underline hover:text-emerald-600">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
