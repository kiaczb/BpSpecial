import LoginButton from "./LoginButton";
const LoginBar = ({ competitionName }: { competitionName: string }) => {
  return (
    <div className="bg-white shadow flex items-center justify-between py-2 px-3 dark:bg-slate-800 dark:text-white dark:shadow-slate-700">
      <h1 className="text-lg font-bold">{competitionName}</h1>
      <LoginButton />
    </div>
  );
};

export default LoginBar;
