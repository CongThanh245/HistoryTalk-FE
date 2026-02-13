// import { Role } from "@/constants/roles";


// export const routeAccessConfig: Record<string, Role[]> = {
//   // Public pages - accessible to all users
//   "/": [Role.USER],
//   "/about": [Role.USER],
//   "/contact": [Role.USER],

//   // Private pages - accessible only to STAFF and ADMIN
//   "/dashboard": [Role.STAFF, Role.ADMIN],
//   "/profile": [Role.STAFF, Role.ADMIN],

//   // Auth routes - not accessible to anyone after login
//   "/login": [],
//   "/register": [],
// };

// export function getAllowedRolesForPath(pathname: string): Role[] | undefined {
//   return Object.keys(routeAccessConfig).find((route) =>
//     pathname.startsWith(route)
//   )
//     ? routeAccessConfig[
//         Object.keys(routeAccessConfig).find((route) =>
//           pathname.startsWith(route)
//         )!
//       ]
//     : undefined;
// }
