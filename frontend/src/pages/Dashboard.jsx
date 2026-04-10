import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { getQueriesByUser } from "../services/QueryApis";

const Dashboard = () => {
  const user = useSelector((state) => state.user.data);

  const [userQueries, setUserQueries] = useState([]);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await getQueriesByUser();

        if (res) {
          setUserQueries(res?.data?.queries);
        }
      } catch (err) {
        console.error(err.response?.data);
      }
    };

    fetchQueries();
  }, [user]);

  return (
    <div>
      <p>Hello {user?.firstName}</p>
      <p>Your Queries</p>

      {userQueries.length == 0 ? (
        <div>no queries yet</div>
      ) : (
        <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden mt-4 shadow-sm">
          <thead className="bg-gray-100">
            <tr className="text-left text-sm font-semibold text-gray-700">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y text-white">
            {userQueries?.map((query) => {
              return (
                <tr key={query._id}>
                  <td>{query.title}</td>
                  <td>{query.description}</td>
                  <td>{query.priority}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard;
