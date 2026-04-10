///all the imports here
import { useSelector } from "react-redux";

const Dashboard = () => {
  const user = useSelector((state) => state.user.data);
  console.log(user.queries);

  return (
    <div>
      <p>Hello {user?.firstName}</p>
      <p>Your Queries</p>

      <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden mt-4 shadow-sm">
        <thead className="bg-gray-100">
          <tr className="text-left text-sm font-semibold text-gray-700">
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Priority</th>
          </tr>
        </thead>
        <tbody className="divide-y text-white">
          {user?.queries?.map((query) => {
            return (
              <tr>
                <td>{query.title}</td>
                <td>{query.description}</td>
                <td>{query.priority}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
