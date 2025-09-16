// LoginButton.tsx
import React from "react";
import { useAuth } from "../api/AuthContext";

const LoginButton: React.FC = () => {
  const { user, signIn, signOut } = useAuth();

  if (!user) {
    return <button className="text-l p-3 border-1 rounded-2xl text-amber-600 cursor-pointer" onClick={signIn}>Login with WCA</button>;
  }

  return <button className="text-l p-3 border-1 rounded-2xl text-amber-600 cursor-pointer" onClick={signOut}>Logout ({user.name})</button>;
};

export default LoginButton;
