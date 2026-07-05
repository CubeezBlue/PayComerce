import { redirect } from "next/navigation";

// Las categorías ahora se gestionan dentro de Productos.
export default function CategoriasRedirect() {
  redirect("/admin/productos");
}
