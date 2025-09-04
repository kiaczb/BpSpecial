const LoginBar = ({ competitionName }: { competitionName: string }) => {
  return (
    <div className="bg-white shadow flex items-center justify-between py-2 px-3">
      <h1 className="text-lg font-bold">{competitionName}</h1>
      <button className="text-l p-3 border-1 rounded-2xl text-amber-600 cursor-pointer">
        Log in
      </button>
    </div>
  );
};

export default LoginBar;
