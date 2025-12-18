import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <div className="navbar bg-base-100 sticky top-0 z-40 shadow-sm">
      <div className="navbar-start">
        <NavLink to="/" className="btn btn-ghost text-xl">TEAMS Case Projects</NavLink>
      </div>

      <div className="navbar-center hidden md:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink
              to="/companies"
              className={({ isActive }) => isActive ? "active font-semibold" : ""}
            >
              Companies
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/addresses"
              className={({ isActive }) => isActive ? "active font-semibold" : ""}
            >
              Addresses
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/case-models"
              className={({ isActive }) => isActive ? "active font-semibold" : ""}
            >
              Case Models
            </NavLink>
          </li>
          {/* Add more links as you grow */}
        </ul>
      </div>

      <div className="navbar-end">
        {/* Right-side actions (theme toggle, user menu) can go here */}
        #helpHelp</a>
      </div>
    </div>
  );
}
