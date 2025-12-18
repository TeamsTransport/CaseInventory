import { useEffect, useMemo, useState } from "react";
import SearchableComboBox, { ComboOption } from "../components/inputs/SearchableComboBox";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

/** UI model (camelCase) for Companies table: */
type Company = {
  companyId: number;
  companyName: string;
  addressId: number | null;
  createdAt: string; // ISO
};

/** UI model for address list (for the combo box) */
type Address = {
  addressId: number;
  street: string;
  city: string;
  province: string;
  postalCode: string;
};

type CompanyForm = Partial<Pick<Company, "companyName" | "addressId">>;

export default function Companies() {
  // Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Addresses (for dropdown)
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrError, setAddrError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);

  const title = useMemo(() => (isEditing ? "Edit Company" : "Add Company"), [isEditing]);

  /** Normalizers */
  const normalizeCompany = (c: any): Company => ({
    companyId: Number(c.company_id),
    companyName: String(c.company_name ?? ""),
    addressId: c.address_id == null ? null : Number(c.address_id),
    createdAt: c.created_at ?? new Date().toISOString(),
  });

  const normalizeAddress = (a: any): Address => ({
    addressId: Number(a.address_id),
    street: String(a.street ?? ""),
    city: String(a.city ?? ""),
    province: String(a.province ?? ""),
    postalCode: String(a.postal_code ?? ""),
  });

  /** API mappers */
  const toPayload = (f: CompanyForm) => ({
    company_name: f.companyName ?? "",
    address_id: f.addressId ?? null, // nullable FK
  });

  /** Fetchers */
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/companies`);
      if (!res.ok) throw new Error(`Failed to load companies (${res.status})`);
      const data = await res.json();
      setCompanies((data ?? []).map(normalizeCompany));
    } catch (e: any) {
      setError(e.message || "Error loading companies");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setAddrLoading(true);
      setAddrError(null);
      const res = await fetch(`${API}/api/addresses`);
      if (!res.ok) throw new Error(`Failed to load addresses (${res.status})`);
      const data = await res.json();
      setAddresses((data ?? []).map(normalizeAddress));
    } catch (e: any) {
      setAddrError(e.message || "Error loading addresses");
    } finally {
      setAddrLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchAddresses();
  }, []);

  /** Address label + options for combo */
  const formatAddress = (a: Address) =>
    [a.street, a.city, a.province, a.postalCode].filter(Boolean).join(", ");

  const addressOptions: ComboOption<number>[] = useMemo(
    () => addresses.map((a) => ({ value: a.addressId, label: formatAddress(a) })),
    [addresses]
  );

  const addressMap = useMemo(() => {
    const m = new Map<number, Address>();
    for (const a of addresses) m.set(a.addressId, a);
    return m;
  }, [addresses]);

  /** Modal helpers */
  const openAdd = () => {
    setSelected(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (c: Company) => {
    setSelected(c);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (companyId: number) => {
    if (!confirm("Delete this company?")) return;
    try {
      const res = await fetch(`${API}/api/companies/${companyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await fetchCompanies();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const handleSave: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const companyName = String(fd.get("companyName") || "").trim();
    const rawAddressId = String(fd.get("addressId") ?? "");
    const addressId = rawAddressId === "" ? null : Number(rawAddressId);

    if (!companyName) {
      alert("Company Name is required.");
      return;
    }
    if (addressId !== null && Number.isNaN(addressId)) {
      alert("Address must be selected from the list, or cleared.");
      return;
    }

    const form: CompanyForm = { companyName, addressId };

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `${API}/api/companies/${selected!.companyId}`
        : `${API}/api/companies`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      if (!res.ok) {
        const msg = await safeErrorMessage(res);
        throw new Error(`${isEditing ? "Update" : "Create"} failed: ${msg}`);
      }

      setShowModal(false);
      setSelected(null);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchCompanies();
    } catch (err: any) {
      alert(err.message || "Save failed");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Companies</h2>
        <button className="btn btn-primary" onClick={openAdd}>Add Company</button>
      </div>

      {(error || addrError) && (
        <div className="alert alert-error">
          <span>{error || addrError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3">
          <span className="loading loading-spinner loading-md" />
          <span>Loading companies…</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Company ID</th>
                <th>Company Name</th>
                <th className="hidden md:table-cell">Address</th>
                <th className="hidden lg:table-cell">Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const addr = c.addressId != null ? addressMap.get(c.addressId) : undefined;
                return (
                  <tr key={c.companyId}>
                    <td>{c.companyId}</td>
                    <td className="font-medium">{c.companyName}</td>
                    <td className="hidden md:table-cell">{addr ? formatAddress(addr) : "—"}</td>
                    <td className="hidden lg:table-cell">{formatLocal(c.createdAt)}</td>
                    <td className="flex gap-2">
                      <button className="btn btn-xs" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-xs btn-error" onClick={() => handleDelete(c.companyId)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-sm text-base-content/70">
                    No companies yet.
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
            {/* Company Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Company Name *</span>
              </label>
              <input
                name="companyName"
                defaultValue={selected?.companyName ?? ""}
                required
                className="input input-bordered"
              />
            </div>

            {/* Address combo */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Address</span>
                {addrLoading && (
                  <span className="label-text-alt inline-flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs" /> Loading…
                  </span>
                )}
              </label>

              <SearchableComboBox<number>
                name="addressId"
                value={selected?.addressId ?? null}
                onChange={(val) => {
                  // Keep local state in sync while editing:
                  if (selected) setSelected({ ...selected, addressId: val });
                }}
                options={addressOptions}
                placeholder="Type to search addresses…"
                allowEmpty
                emptyLabel="No address"
                disabled={addrLoading || !!addrError}
              />
              <label className="label">
                <span className="label-text-alt">
                  Choose <em>No address</em> to set <code>address_id</code> to <code>NULL</code>.
                </span>
              </label>
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
