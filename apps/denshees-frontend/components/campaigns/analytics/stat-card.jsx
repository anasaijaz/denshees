const StatCard = ({ title, value, icon }) => {
  return (
    <div className="border border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-between gap-3">
      <div className="w-12 h-12 border border-black bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );
};

export default StatCard;
