import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateQuery, getQueriesByUser } from "../services/QueryApis";

export const UpdateQuery = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get query ID from URL

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Fetch the query data when component mounts
  useEffect(() => {
    const fetchQuery = async () => {
      try {
        const res = await getQueriesByUser();
        const queries = res?.data?.queries;
        const queryToEdit = queries?.find((q) => q._id === id);

        if (queryToEdit) {
          setTitle(queryToEdit.title);
          setPriority(queryToEdit.priority);
          setDescription(queryToEdit.description);
        } else {
          console.error("Query not found");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching query:", error);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchQuery();
    }
  }, [id, navigate]);

  const validateInput = () => {
    const newError = {};

    if (!title.trim()) {
      newError.title = "Query Type is required";
    }

    if (!priority.trim()) {
      newError.priority = "Priority Level is required";
    }
    if (!description.trim()) {
      newError.description = "Description is required";
    } else if (description.trim().length < 10) {
      newError.description = "Description must be more than 10 characters";
    }

    setErrors(newError);
    return Object.keys(newError).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInput()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateQuery(id, {
        title,
        description,
        priority,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating query:", error);
      alert(error.response?.data?.message || "Failed to update query");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading query data...</p>
      </div>
    );
  }

  return (
    <div className="Add Queries Container">
      <h1>Update Query</h1>

      <form onSubmit={handleSubmit}>
        <div className="query-form">
          <select
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          >
            <option value="">Set Query Type</option>
            <option value="Wi-Fi">Wi-Fi</option>
            <option value="Electrical">Electrical</option>
            <option value="Safety">Safety</option>
            <option value="ERP">ERP</option>
            <option value="Library">Library</option>
            <option value="Staff">Staff</option>
          </select>
          {errors.title && <span className="error">{errors.title}</span>}
        </div>

        <div className="query-form">
          <select
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Select Priority Level</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          {errors.priority && <span className="error">{errors.priority}</span>}
        </div>

        <div className="query-form">
          <textarea
            name="description"
            value={description}
            placeholder="Please describe your issue in detail"
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          {errors.description && (
            <span className="error">{errors.description}</span>
          )}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Query"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{ marginLeft: "10px", backgroundColor: "#666" }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default UpdateQuery;
