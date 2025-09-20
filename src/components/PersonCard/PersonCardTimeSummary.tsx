import { convertResult } from "../../utils/personCardUtils";

interface PersonCardTimeSummaryProps {
  remainingTime: number;
  usedTime: number;
}

const PersonCardTimeSummary = ({
  remainingTime,
  usedTime,
}: PersonCardTimeSummaryProps) => {
  return (
    <div className="justify-items-stretch mt-3">
      <table className="table-auto w-full">
        <thead className="text-center">
          <tr>
            <th className="dark:text-gray-300">Remaining</th>
            <th className="dark:text-gray-300">Used</th>
          </tr>
        </thead>
        <tbody className="text-center">
          <tr>
            <td className="dark:text-gray-100">
              {convertResult(remainingTime)}
            </td>
            <td className="dark:text-gray-100">{convertResult(usedTime)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PersonCardTimeSummary;
