import React from "react";
import { useAuth } from "../context/AuthContext";

const LoginButton: React.FC = () => {
  const { user, signIn, signOut } = useAuth();

  if (!user) {
    return (
      <button
        className="text-l font-bold p-3 border-2 rounded-2xl text-cyan-600 cursor-pointer hover:bg-cyan-600 duration-75 ease-in hover:text-white dark:text-emerald-500 dark:hover:bg-emerald-600 dark:hover:border-emerald-500"
        onClick={signIn}
      >
        Login with WCA
      </button>
    );
  }

  return (
    <button
      className="text-l font-bold p-3 border-2 rounded-2xl text-white bg-cyan-600 border-cyan-500 cursor-pointer hover:bg-cyan-800 duration-75 ease-in dark:text-white dark:bg-emerald-600 dark:hover:bg-emerald-800 dark:border-emerald-500"
      onClick={signOut}
    >
      Logout ({user.name})
    </button>
  );
};

export default LoginButton;
