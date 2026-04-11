import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import GetService from './services/GetService.jsx';
import { addQuery } from "../services/QueryApis";

export const AddQuery = () => {
  const navigate = useNavigate();

  const [queryType, setQueryType] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const valiDateInput = () =>{
    const newError = {};

    if(!queryType.trim()){
        newError.queryType ="Query Type is required";
    }
    if(!priority.trim()){
        newError.priority = "Priority Level is required";
    }
    if(!description.trim()){
        newError.description = "Description is required";
    }
    else if(description.trim().length < 10){
        newError.description = "DEscription empasis must be more than 10 words";
    }

    setErrors(newError);
  }

  const handleSubmit =async() =>{
    if(!valiDateInput){
        return;
    }

    setIsSubmitting(true);

    try {
        const response = await addQuery({
            title: queryType,
            description: description,
            priority: priority
        });

        navigate('/dashboard');
    } catch (error) {
        console.log(error);
        
    }finally{
        setIsSubmitting(false);
    }
  }

  return (
    <div className="Add Queries Container">
      <h1>Add queries</h1>

      <form onSubmit={handleSubmit}>
        <div className="query-form">
          <label htmlFor="queryType"></label>
          <select
            name="queryType"
            id="queryType"
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
          <label htmlFor="priority"></label>
          <select
            name="priority"
            value={priority}
            id="priority"
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Select Priority Level</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            {/* <option value="Critical">Critical</option> */}
          </select>
        </div>

        <div className="query-form">
          <label htmlFor="description"></label>
          <textarea
            name="description"
            id="description"
            value={description}
            placeholder="Please emphasize your issue in detail"
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Query"}
        </button>
      </form>
    </div>
  );

}

export default AddQuery;
