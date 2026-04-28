import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addQuery } from "../services/QueryApis";

export const AddQuery = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [javaAnalysis, setJavaAnalysis] = useState(null);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInput()) {
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("priority", priority);
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await addQuery(formData);

      // Check if Java analysis came back
      if (response?.data?.javaAnalysis) {
        setJavaAnalysis(response.data.javaAnalysis);
        if (response.data.warning) {
          alert(`🤖 ${response.data.warning}`);
        }
      }

      // Show success and navigate
      alert("Query submitted successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
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

      {/* Java Analysis Result - Shows after submission */}
      {javaAnalysis && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h3 className="text-sm font-semibold text-emerald-800">
              Java AI Analysis
            </h3>
          </div>
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-xs text-emerald-600">
                Suggested Priority:
              </span>
              <span
                className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  javaAnalysis.priority === "High"
                    ? "bg-rose-100 text-rose-700"
                    : javaAnalysis.priority === "Medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {javaAnalysis.priority}
              </span>
            </div>
            <div>
              <span className="text-xs text-emerald-600">Urgency Score:</span>
              <span className="ml-2 text-sm font-bold text-emerald-800">
                {javaAnalysis.score}
              </span>
            </div>
          </div>
          {javaAnalysis.matches && javaAnalysis.matches.length > 0 && (
            <p className="mt-2 text-xs text-emerald-600">
              Matched keywords: {javaAnalysis.matches.join(", ")}
            </p>
          )}
          <p className="mt-2 text-xs text-emerald-600">
            ⚡ Your query will be reviewed by our team.
          </p>
        </div>
      )}

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
            className="min-h-[140px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          ></textarea>
          {errors.description && (
            <span className="mt-1 block text-xs text-rose-600">
              {errors.description}
            </span>
          )}
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Attach Image (Optional)
          </label>
          <div className="mt-1 flex items-center gap-4">
            <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Choose File
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {image && (
              <span className="text-sm text-slate-600">{image.name}</span>
            )}
          </div>
          {imagePreview && (
            <div className="mt-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg border border-slate-200 object-cover"
              />
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Supported formats: JPEG, PNG, JPG, GIF (Max 5MB)
          </p>
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
