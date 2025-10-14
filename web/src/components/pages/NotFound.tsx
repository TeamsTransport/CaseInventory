import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <Link className="btn btn-primary" to="/">Go Home</Link>
    </div>
  );
}
