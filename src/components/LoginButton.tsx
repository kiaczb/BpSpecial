// LoginButton.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";

const LoginButton: React.FC = () => {
  const { user, signIn, signOut } = useAuth();

  if (!user) {
    return (
      <button
        className="text-l p-3 border-1 rounded-2xl text-amber-600 cursor-pointer dark:text-amber-400 dark:border-amber-400 dark:hover:bg-amber-400/10"
        onClick={signIn}
      >
        Login with WCA
      </button>
    );
  }

  return (
    <button
      className="text-l p-3 border-1 rounded-2xl text-amber-600 cursor-pointer dark:text-amber-400 dark:border-amber-400 dark:hover:bg-amber-400/10"
      onClick={signOut}
    >
      Logout ({user.name})
    </button>
  );
};

export default LoginButton;
