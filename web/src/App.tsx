import { useEffect, useState } from "react"

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"

type Customer = {
  id: number
  name: string
  email?: string
  created_at: string
}

export default function App(){
  const [data,setData] = useState<Customer[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/customers`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  },[])

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow">
        <div className="flex-1 px-2 text-xl font-bold">Access → MariaDB Demo</div>
      </div>

      <div className="p-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Customers</h2>
            {loading ? (
              <span className="loading loading-spinner loading-lg"></span>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Email</th><th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(c => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.name}</td>
                        <td>{c.email || "-"}</td>
                        <td>{new Date(c.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}