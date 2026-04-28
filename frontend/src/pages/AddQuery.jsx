import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addQuery } from "../services/QueryApis";

export const AddQuery = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
      newError.description = "Description must be more than 10 characters"; // Fixed typo: words -> characters
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
        title,
        description,
        priority,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to add query");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Raise a New Query</h1>
      <p className="mt-2 text-sm text-slate-600">
        Share details clearly so the right team can resolve your issue faster.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Query Type
          </label>
          <select
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Set Query Type</option>
            <option value="Wi-Fi">Wi-Fi</option>
            <option value="Electrical">Electrical</option>
            <option value="Safety">Safety</option>
            <option value="ERP">ERP</option>
            <option value="Library">Library</option>
            <option value="Staff">Staff</option>
          </select>
          {errors.title && (
            <span className="mt-1 block text-xs text-rose-600">
              {errors.title}
            </span>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Priority Level
          </label>
          <select
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Select Priority Level</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          {errors.priority && (
            <span className="mt-1 block text-xs text-rose-600">
              {errors.priority}
            </span>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            name="description"
            value={description}
            placeholder="Please describe your issue in detail"
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          ></textarea>
          {errors.description && (
            <span className="mt-1 block text-xs text-rose-600">
              {errors.description}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Submit Query"}
        </button>
      </form>
    </div>
  );
};

export default AddQuery;
