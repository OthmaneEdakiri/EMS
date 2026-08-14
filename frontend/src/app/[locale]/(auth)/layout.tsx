import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-svh items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
};

export default AuthLayout;
