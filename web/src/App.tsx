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

  // Event handler for method selection
  const handleMethodSelect = (event: React.MouseEvent) => {
    const methodCard = event.currentTarget.closest('.method-card');
    const methodName = methodCard?.querySelector('h3')?.textContent;
    alert(`You selected the "${methodName}" method!`);
  };

  // Event handler for copy code button
  const handleCopyCode = () => {
    alert('VBA code copied to clipboard!');
  };

  return (
    <>
    <div classname="bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg">
        <div classname="container mx-auto px-4 py-6">
            <div classname="navbar">
                <div classname="navbar-start">
                    <h1 classname="text-3xl font-bold"><i classname="fas fa-database mr-3"></i>AccessDB Relationship Exporter</h1>
                </div>
                <div classname="navbar-end">
                    <div classname="flex space-x-4">
                        <a href="#" classname="btn btn-ghost"><i classname="fas fa-home mr-2"></i> Home</a>
                        <a href="#" classname="btn btn-ghost"><i classname="fas fa-question-circle mr-2"></i> Help</a>
                        <a href="#" classname="btn btn-ghost"><i classname="fas fa-cog mr-2"></i> Settings</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <main classname="container mx-auto px-4 py-8">
        <div classname="card bg-base-100 shadow-xl mb-8">
            <div classname="card-body">
                <h2 classname="card-title text-3xl">Export Relationships from Microsoft Access</h2>
                <p classname="text-base-content/70">There are several methods to export relationships from your Access database. Choose the one that best fits your needs.</p>
                
                <div classname="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Method 1 */}
                    <div classname="method-card card bg-base-100 shadow-md border border-base-300">
                        <div classname="card-body">
                            <div classname="flex items-center mb-4">
                                <div classname="bg-blue-100 text-primary rounded-full p-3 mr-4">
                                    <i classname="fas fa-file-pdf text-xl"></i>
                                </div>
                                <h3 classname="card-title">Database Documenter</h3>
                            </div>
                            <p classname="text-base-content/70">Generate a detailed report of your database schema including relationships.</p>
                            <ul classname="text-sm text-base-content/70 my-4 space-y-2">
                                <li classname="flex items-start">
                                    <i classname="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <span>Easy, no coding required</span>
                                </li>
                                <li classname="flex items-start">
                                    <i classname="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <span>Great for documentation</span>
                                </li>
                                <li classname="flex items-start">
                                    <i classname="fas fa-times text-red-500 mt-1 mr-2"></i>
                                    <span>Output is a formatted report, not structured data</span>
                                </li>
                            </ul>
                            <div classname="card-actions justify-end">
                                <button classname="btn btn-primary w-full">
                                    Select Method
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Method 2 */}
                    <div classname="method-card card bg-base-100 shadow-md border border-base-300">
                        <div classname="card-body">
                            <div classname="flex items-center mb-4">
                                <div classname="bg-purple-100 text-secondary rounded-full p-3 mr-4">
                                    <i classname="fas fa-file-excel text-xl"></i>
                                </div>
                                <h3 classname="card-title">Export to Excel</h3>
                            </div>
                            <p classname="text-base-content/70">Export the Relationship Report to Excel for further manipulation.</p>
                            <ul classname="text-sm text-base-content/70 my-4 space-y-2">
                                <li classname="flex items-start">
                                    <i classname="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <span>Gets data into Excel</span>
                                </li>
                                <li classname="flex items-start">
                                    <i classname="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <span>Versatile output format</span>
                                </li>
                                <li classname="flex items-start">
                                    <i classname="fas fa-times text-red-500 mt-1 mr-2"></i>
                                    <span>Requires manual cleanup</span>
                                </li>
                            </ul>
                            <div classname="card-actions justify-end">
                                <button classname="btn btn-secondary w-full">
                                    Select Method
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Method 3 */}
                    <div classname="method-card card bg-base-100 shadow-md border border-base-300">
                        <div classname="card-body">
                            <div classname="flex items-center mb-4">
                                <div classname="bg-pink-100 text-accent rounded-full p-3 mr-4">
                                    <i classname="fas fa-code text-xl"></i>
                                </div>
                                <h3 classname="card-title">VBA Code</h3>
                            </div>
                            <p classname="text-base-content/70">Use VBA to extract relationship data into a table for easy export.</p>
                            <ul classname="text-sm text-base-content/70 my-4 space-y-2">
                                <li classname="flex items-start">
                                    <i classname="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <span>Clean, structured data</span>
                                </li>
                                <li classname="flex items-start">
                                    <i classname="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <span>Fully automated and reusable</span>
                                </li>
                                <li classname="flex items-start">
                                    <i classname="fas fa-times text-red-500 mt-1 mr-2"></i>
                                    <span>Requires VBA knowledge</span>
                                </li>
                            </ul>
                            <div classname="card-actions justify-end">
                                <button classname="btn btn-accent w-full">
                                    Select Method
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Method 4 */}
                    <div classname="method-card card bg-base-100 shadow-md border border-base-300">
                        <div classname="card-body">
                            <div classname="flex items-center mb-4">
                                <div classname="bg-green-100 text-green-600 rounded-full p-3 mr-4">
                                    <i classname="fas fa-camera text-xl"></i>
                                </div>
                                <h3 classname="card-title">Screenshot</h3>
                            </div>
                            <p classname="text-base-content/70">Take a screenshot of the Relationships window for quick reference.</p>
                            <ul classname="text-sm text-base-content/70 my-4 space-y-2">
                                <li classname="flex items-start">
                                    <i classname="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <span>Instant visual reference</span>
                                </li>
                                <li classname="flex items-start">
                                    <i classname="fas fa-check text-green-500 mt-1 mr-2"></i>
                                    <span>No technical knowledge needed</span>
                                </li>
                                <li classname="flex items-start">
                                    <i classname="fas fa-times text-red-500 mt-1 mr-2"></i>
                                    <span>Not analyzable data</span>
                                </li>
                            </ul>
                            <div classname="card-actions justify-end">
                                <button classname="btn btn-success w-full">
                                    Select Method
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div classname="card bg-base-100 shadow-xl mb-8">
            <div classname="card-body">
                <h2 classname="card-title text-3xl">VBA Code Example</h2>
                <p classname="text-base-content/70">Here's the VBA code to export relationships to a table:</p>
                
                <div classname="mockup-code bg-neutral text-neutral-content mb-6">
                    <pre><code>    <span classname="text-info">Sub</span> <span classname="text-warning">ExportRelationshipsToTable</span>()</code></pre>
                    <pre><code>    <span classname="text-neutral-content/70">' Purpose: Exports database relationship info to a table</span></code></pre>
                    <pre><code>    <span classname="text-neutral-content/70">' Author: Adapted for this guide</span></code></pre>
                    <pre><code>    <span classname="text-info">Dim</span> db <span classname="text-info">As</span> DAO.Database</code></pre>
                    <pre><code>    <span classname="text-info">Dim</span> rel <span classname="text-info">As</span> DAO.Relation</code></pre>
                    <pre><code>    <span classname="text-info">Dim</span> fld <span classname="text-info">As</span> DAO.Field</code></pre>
                    <pre><code>    <span classname="text-info">Dim</span> newTable <span classname="text-info">As</span> DAO.TableDef</code></pre>
                    <pre><code>    <span classname="text-info">Dim</span> rs <span classname="text-info">As</span> DAO.Recordset</code></pre>
                    <pre><code>    </code></pre>
                    <pre><code>    <span classname="text-info">Set</span> db = CurrentDb()</code></pre>
                    <pre><code>    </code></pre>
                    <pre><code>    <span classname="text-neutral-content/70">' Delete the table if it already exists</span></code></pre>
                    <pre><code>    <span classname="text-info">On Error Resume Next</span></code></pre>
                    <pre><code>    db.TableDefs.Delete <span classname="text-success">"zExport_Relationships"</span></code></pre>
                    <pre><code>    <span classname="text-info">On Error GoTo</span> ErrorHandler</code></pre>
                    <pre><code>    </code></pre>
                    <pre><code>    <span classname="text-neutral-content/70">' Create a new table to hold the relationship info</span></code></pre>
                    <pre><code>    <span classname="text-info">Set</span> newTable = db.CreateTableDef(<span classname="text-success">"zExport_Relationships"</span>)</code></pre>
                    <pre><code>    </code></pre>
                    <pre><code>    <span classname="text-neutral-content/70">' Create fields in the new table</span></code></pre>
                    <pre><code>    <span classname="text-info">With</span> newTable</code></pre>
                    <pre><code>        .Fields.Append .CreateField(<span classname="text-success">"RelationshipName"</span>, dbText)</code></pre>
                    <pre><code>        .Fields.Append .CreateField(<span classname="text-success">"TableName"</span>, dbText)</code></pre>
                    <pre><code>        .Fields.Append .CreateField(<span classname="text-success">"ForeignKey"</span>, dbText)</code></pre>
                    <pre><code>        <span classname="text-neutral-content/70">' ... more field definitions</span></code></pre>
                    <pre><code>    <span classname="text-info">End With</span></code></pre>
                    <pre><code>    </code></pre>
                    <pre><code>    <span classname="text-neutral-content/70">' Append the new table to the database</span></code></pre>
                    <pre><code>    db.TableDefs.Append newTable</code></pre>
                    <pre><code>    </code></pre>
                    <pre><code>    <span classname="text-neutral-content/70">' Loop through all relationships in the database</span></code></pre>
                    <pre><code>    <span classname="text-info">For Each</span> rel <span classname="text-info">In</span> db.Relations</code></pre>
                    <pre><code>        <span classname="text-neutral-content/70">' We only want user-defined relationships</span></code></pre>
                    <pre><code>        <span classname="text-info">If</span> Left(rel.Name, 4) !== <span classname="text-success">"MSys"</span> <span classname="text-info">Then</span></code></pre>
                    <pre><code>            <span classname="text-info">For Each</span> fld <span classname="text-info">In</span> rel.Fields</code></pre>
                    <pre><code>                <span classname="text-neutral-content/70">' Add records to the table</span></code></pre>
                    <pre><code>                rs.AddNew</code></pre>
                    <pre><code>                rs!RelationshipName = rel.Name</code></pre>
                    <pre><code>                rs!TableName = fld.Name</code></pre>
                    <pre><code>                <span classname="text-neutral-content/70">' ... more field assignments</span></code></pre>
                    <pre><code>                rs.Update</code></pre>
                    <pre><code>            <span classname="text-info">Next</span> fld</code></pre>
                    <pre><code>        <span classname="text-info">End If</span></code></pre>
                    <pre><code>    <span classname="text-info">Next</span> rel</code></pre>
                    <pre><code>    </code></pre>
                    <pre><code>    rs.Close</code></pre>
                    <pre><code>    MsgBox <span classname="text-success">"Relationships exported to table 'zExport_Relationships'."</span>, vbInformation</code></pre>
                    <pre><code>    <span classname="text-info">Exit Sub</span></code></pre>
                    <pre><code>    </code></pre>
                    <pre><code>ErrorHandler:</code></pre>
                    <pre><code>    MsgBox <span classname="text-success">"Error "</span> & Err.Number & <span classname="text-success">": "</span> & Err.Description, vbCritical</code></pre>
                    <pre><code>    <span classname="text-info">Exit Sub</span></code></pre>
                    <pre><code><span classname="text-info">End Sub</span></code></pre>
                </div>
                
                <div classname="alert alert-info mb-6">
                    <div>
                        <i classname="fas fa-info-circle text-2xl"></i>
                        <div>
                            <h3 classname="font-bold">Note about the Tailwind config</h3>
                            <div classname="text-xs">The <code>@type</code> comment should remain commented out. It's a JSDoc annotation that provides type information for IDEs but doesn't affect functionality.</div>
                        </div>
                    </div>
                </div>
                
                <div classname="flex justify-between flex-col md:flex-row gap-4">
                    <button classname="btn btn-neutral">
                        <i classname="fas fa-download mr-2"></i> Download VBA Module
                    </button>
                    <button classname="btn btn-primary">
                        Copy Code <i classname="fas fa-copy ml-2"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <div classname="card bg-base-100 shadow-xl">
            <div classname="card-body">
                <h2 classname="card-title text-3xl">Export Results Preview</h2>
                <p classname="text-base-content/70">Once exported, your relationships data will look similar to this:</p>
                
                <div classname="overflow-x-auto mt-4">
                    <table classname="table table-zebra">
                        <thead>
                            <tr>
                                <th>Relationship Name</th>
                                <th>Table</th>
                                <th>Foreign Key</th>
                                <th>Related Table</th>
                                <th>Primary Key</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>FK_Customers_Orders</td>
                                <td>Orders</td>
                                <td>CustomerID</td>
                                <td>Customers</td>
                                <td>CustomerID</td>
                            </tr>
                            <tr>
                                <td>FK_Products_Orders</td>
                                <td>OrderDetails</td>
                                <td>ProductID</td>
                                <td>Products</td>
                                <td>ProductID</td>
                            </tr>
                            <tr>
                                <td>FK_Employees_Orders</td>
                                <td>Orders</td>
                                <td>EmployeeID</td>
                                <td>Employees</td>
                                <td>EmployeeID</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div classname="mt-6 flex justify-end space-x-4 flex-col md:flex-row gap-4">
                    <button classname="btn btn-neutral">
                        <i classname="fas fa-file-export mr-2"></i> Export to CSV
                    </button>
                    <button classname="btn btn-success">
                        <i classname="fas fa-file-excel mr-2"></i> Export to Excel
                    </button>
                </div>
            </div>
        </div>
    </main>

    <footer className="footer footer-center p-10 bg-neutral text-neutral-content mt-12">
        <div className="grid grid-flow-col gap-10">
            <div className="text-left">
                <h3 className="footer-title">AccessDB Exporter</h3>
                <p className="max-w-xs">A tool to help you export and analyze relationship data from your Microsoft Access databases.</p>
            </div> 
            <div className="text-left">
                <h3 className="footer-title">Quick Links</h3>
                <div className="grid grid-flow-col gap-4">
                    <a href="#" className="link link-hover">Documentation</a>
                    <a href="#" className="link link-hover">VBA API Reference</a>
                    <a href="#" className="link link-hover">Video Tutorials</a>
                    <a href="#" className="link link-hover">Support Forum</a>
                </div>
            </div>
            <div className="text-left">
                <h3 className="footer-title">Subscribe to Updates</h3>
                <div className="form-control w-80">
                    <label className="label">
                        <span className="label-text text-neutral-content">Enter your email address</span>
                    </label> 
                    <div className="relative">
                        <input type="text" placeholder="username@site.com" className="input input-bordered w-full pr-16" /> 
                        <button className="btn btn-primary absolute top-0 right-0 rounded-l-none">Subscribe</button>
                    </div>
                </div>
            </div>
        </div> 
        <div className="mt-8 pt-6 border-t border-neutral-content/10 text-sm">
            <p>© 2025 TEAMS Transport. All rights reserved.</p>
        </div>
    </footer>
    </>
  )
}