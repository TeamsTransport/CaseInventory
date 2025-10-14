// src/components/CaseModels.tsx
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

type CaseModel = {
  id: number;
  modelName: string;
  widthInches?: number;
  depthInches?: number;
  sqft?: number;
  sqftRounded?: number;
  warehouseSpaceSqft?: number;
  createdAt: string;
};

export default function CaseModels() {
  const [models, setModels] = useState<CaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<CaseModel | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchModels = () => {
    fetch(`${API}/api/case-models`)
      .then((res) => res.json())
      .then(setModels)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this Case Model?")) return;
    fetch(`${API}/api/case-models/${id}`, { method: "DELETE" }).then(() =>
      fetchModels()
    );
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Convert camelCase to snake_case for the backend
    const payload = {
      model_name: formData.get('modelName'),
      width_inches: formData.get('widthInches'),
      depth_inches: formData.get('depthInches'),
      warehouse_space_sqft: formData.get('warehouseSpaceSqft'),
    };

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API}/api/case-models/${selectedModel?.id}`
      : `${API}/api/case-models`;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(() => {
      setShowModal(false);
      setSelectedModel(null);
      fetchModels();
    });
  };

  const openAddModal = () => {
    setSelectedModel(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (model: CaseModel) => {
    setSelectedModel(model);
    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Case Models</h1>
      <button className="btn btn-primary mb-4" onClick={openAddModal}>
        Add Case Model
      </button>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Model Name</th>
                <th>Width (in)</th>
                <th>Depth (in)</th>
                <th>SqFt</th>
                <th>Rounded SqFt</th>
                <th>Warehouse Space</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td>{model.id}</td>
                  <td>{model.modelName}</td>
                  <td>{model.widthInches?.toFixed(2) ?? '—'}</td>
                  <td>{model.depthInches?.toFixed(2) ?? '—'}</td>
                  <td>{model.sqft?.toFixed(4) ?? '—'}</td>
                  <td>{model.sqftRounded ?? '—'}</td>
                  <td>{model.warehouseSpaceSqft ?? '—'}</td>
                  <td>
                    <div className="flex space-x-2"> {/* Add this wrapper div */}
                      <button
                        className="btn btn-sm btn-outline btn-info"
                        onClick={() => openEditModal(model)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => handleDelete(model.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {isEditing ? "Edit Case Model" : "Add Case Model"}
            </h3>
            <form className="mt-4 space-y-2" onSubmit={handleSave}>
              <input
                name="modelName"
                defaultValue={selectedModel?.modelName || ""}
                placeholder="Model Name"
                className="input input-bordered w-full"
              />
              <input
                name="widthInches"
                type="number"
                step="0.01"
                defaultValue={selectedModel?.widthInches || ""}
                placeholder="Width (inches)"
                className="input input-bordered w-full"
              />
              <input
                name="depthInches"
                type="number"
                step="0.01"
                defaultValue={selectedModel?.depthInches || ""}
                placeholder="Depth (inches)"
                className="input input-bordered w-full"
              />
              <input
                name="warehouseSpaceSqft"
                type="number"
                step="0.01"
                defaultValue={selectedModel?.warehouseSpaceSqft || ""}
                placeholder="Warehouse Space SqFt"
                className="input input-bordered w-full"
              />
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}