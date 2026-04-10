///all the imports here
//importing dependencies here
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

//importing apis here
import { getQueriesByUser } from "../services/QueryApis";

const Dashboard = () => {
  ///all the dependencies here
  const user = useSelector((state) => state.user.data);

  ///all the states here
  //state to hold user queries
  const [userQueries, setUserQueries] = useState([]);

  ///all the use effects here
  //effect to fetch queries from backend whenever user changes
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await getQueriesByUser();

        if (res) {
          console.log(res);
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
