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

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

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
          setExistingImage(queryToEdit.imageUrl);
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
    await updateQuery(id, formData);
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
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-600">
          Loading query data...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Update Query</h1>
      <p className="mt-2 text-sm text-slate-600">
        Refine your issue details and resubmit for faster resolution.
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
              Choose New File
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
          {existingImage && !imagePreview && (
            <div className="mt-3">
              <p className="text-sm text-slate-500 mb-1">Current Image:</p>
              <img
                src={`${process.env.REACT_APP_BASE_URL}${existingImage}`}
                alt="Current"
                className="max-h-48 rounded-lg border border-slate-200 object-cover"
              />
            </div>
          )}
          {imagePreview && (
            <div className="mt-3">
              <p className="text-sm text-slate-500 mb-1">New Image Preview:</p>
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

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Updating..." : "Update Query"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateQuery;
