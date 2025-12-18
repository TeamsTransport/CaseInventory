import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

type Address = {
  addressId: number;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  createdAt: string; // ISO
};

type AddressForm = Partial<Omit<Address, "addressId" | "createdAt">>;

export default function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Address | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const title = useMemo(() => (isEditing ? "Edit Address" : "Add Address"), [isEditing]);

  const normalize = (a: any): Address => ({
    addressId: Number(a.address_id),
    street: String(a.street ?? ""),
    city: String(a.city ?? ""),
    province: String(a.province ?? ""),
    postalCode: String(a.postal_code ?? ""),
    createdAt: a.created_at ?? new Date().toISOString(),
  });

  const toPayload = (f: AddressForm) => ({
    street: f.street ?? "",
    city: f.city ?? "",
    province: f.province ?? "",
    postal_code: f.postalCode ?? "",
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/addresses`);
      if (!res.ok) throw new Error(`Failed to load addresses (${res.status})`);
      const data = await res.json();
      setAddresses((data ?? []).map(normalize));
    } catch (e: any) {
      setError(e.message || "Error loading addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAdd = () => {
    setSelected(null);
    setIsEditing(false);
    setSaveError(null);
    setShowModal(true);
  };

  const openEdit = (a: Address) => {
    setSelected(a);
    setIsEditing(true);
    setSaveError(null);
    setShowModal(true);
  };

  const handleDelete = async (addressId: number) => {
    if (!confirm("Delete this address?")) return;
    try {
      const res = await fetch(`${API}/api/addresses/${addressId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await fetchAddresses();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const handleSave: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSaveError(null);
    const fd = new FormData(e.currentTarget);

    const form: AddressForm = {
      street: String(fd.get("street") || "").trim(),
      city: String(fd.get("city") || "").trim(),
      province: String(fd.get("province") || "").trim(),
      postalCode: String(fd.get("postalCode") || "").trim(),
    };

    if (!form.street || !form.city || !form.province || !form.postalCode) {
      setSaveError("All fields are required.");
      return;
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `${API}/api/addresses/${selected!.addressId}`
        : `${API}/api/addresses`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      if (!res.ok) {
        // 409 for UNIQUE violation (street, city, province, postal_code)
        if (res.status === 409) {
          setSaveError("That address already exists (unique constraint).");
        } else {
          const msg = await safeErrorMessage(res);
          setSaveError(`${isEditing ? "Update" : "Create"} failed: ${msg}`);
        }
        return;
      }

      setShowModal(false);
      setSelected(null);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchAddresses();
    } catch (err: any) {
      setSaveError(err.message || "Save failed");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return addresses;
    return addresses.filter((a) =>
      [a.street, a.city, a.province, a.postalCode].join(" ").toLowerCase().includes(q)
    );
  }, [addresses, query]);

  const formatAddress = (a: Address) =>
    [a.street, a.city, a.province, a.postalCode].filter(Boolean).join(", ");

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Addresses</h2>

        <div className="flex items-center gap-3">
          <div className="join">
            <input
              type="text"
              className="input input-bordered join-item"
              placeholder="Search addresses…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn join-item" onClick={() => setQuery("")}>Clear</button>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>Add Address</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3">
          <span className="loading loading-spinner loading-md" />
          <span>Loading addresses…</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>ID</th>
                <th>Street</th>
                <th>City</th>
                <th>Province</th>
                <th>Postal Code</th>
                <th className="hidden lg:table-cell">Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.addressId}>
                  <td>{a.addressId}</td>
                  <td className="font-medium">{a.street}</td>
                  <td>{a.city}</td>
                  <td>{a.province}</td>
                  <td>{a.postalCode}</td>
                  <td className="hidden lg:table-cell">{formatLocal(a.createdAt)}</td>
                  <td className="flex gap-2">
                    <button className="btn btn-xs" onClick={() => openEdit(a)}>Edit</button>
                    <button className="btn btn-xs btn-error" onClick={() => handleDelete(a.addressId)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-base-content/70">
                    No addresses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <dialog className={`modal ${showModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">{title}</h3>

          <form className="mt-4 space-y-4" onSubmit={handleSave}>
            {saveError && (
              <div className="alert alert-warning">
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Street *</span></label>
                <input
                  name="street"
                  defaultValue={selected?.street ?? ""}
                  required
                  className="input input-bordered"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">City *</span></label>
                <input
                  name="city"
                  defaultValue={selected?.city ?? ""}
                  required
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Province *</span></label>
                <input
                  name="province"
                  defaultValue={selected?.province ?? ""}
                  required
                  className="input input-bordered"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Postal Code *</span></label>
                <input
                  name="postalCode"
                  defaultValue={selected?.postalCode ?? ""}
                  required
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="modal-action">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop" onSubmit={() => setShowModal(false)}>
          <button>close</button>
        </form>
      </dialog>
    </section>
  );
}

/** Helpers */
function formatLocal(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

async function safeErrorMessage(res: Response) {
  try {
    const data = await res.json();
    return data?.message || res.statusText;
  } catch {
    return res.statusText;
  }
}
