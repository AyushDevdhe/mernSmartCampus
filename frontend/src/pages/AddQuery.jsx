import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addQuery } from "../services/QueryApis";

export const AddQuery = () => {
  const navigate = useNavigate();

  const [queryType, setQueryType] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateInput = () => {
    const newError = {};

    if (!queryType.trim()) {
      newError.queryType = "Query Type is required";
    }

    if (!priority.trim()) {
      newError.priority = "Priority Level is required";
    }
    if(!description.trim()){
        newError.description = "Description is required";
    }
    else if(description.trim().length < 10){
        newError.description = "Description empasis must be more than 10 words"; 
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
      await addQuery({
        title: queryType,
        description,
        priority,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="Add Queries Container">
      <h1>Add queries</h1>

      <form onSubmit={handleSubmit}>
        <div className="query-form">
          <select
            name="queryType"
            value={queryType}
            onChange={(e) => setQueryType(e.target.value)}
          >
            <option value="">Set Query Type</option>
            <option value="Wi-Fi">Wi-Fi</option>
            <option value="Electrical">Electrical</option>
            <option value="Safety">Safety</option>
            <option value="ERP">ERP</option>
            <option value="Library">Library</option>
            <option value="Staff">Staff</option>
          </select>
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
        </div>

        <div className="query-form">
          <textarea
            name="description"
            value={description}
            placeholder="Please describe your issue in detail"
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Query"}
        </button>
      </form>
    </div>
  );
};

export default AddQuery;
