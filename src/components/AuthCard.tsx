import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

const AuthCard = ({ children }: AuthCardProps) => (
  <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-fade-up">
    <div className="h-1.5 bg-[linear-gradient(90deg,#2f5f35_0%,#ffffff_50%,#96333d_100%)]" />
    <div className="p-6 md:p-8">{children}</div>
  </div>
);

export default AuthCard;
