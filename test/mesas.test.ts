import { describe, it, expect } from "vitest";
import {
  createRoom, createTable, getTablesWithCarts, openCart, addCartItem, listCartItems, closeCart,
  cashReport, tableSalesStats, sendTableToKitchen, listKitchenTickets, advanceKitchenTicket, readyTableIds,
} from "../lib/db";
import { freshStore } from "./helper";

const todayArg = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

function setupTable(db: import("better-sqlite3").Database) {
  const room = createRoom("Salón", db);
  const tableId = createTable({ room_id: room, name: "5" }, db);
  return tableId;
}

describe("servicio de mesas", () => {
  it("suma cantidad al repetir el mismo producto en la cuenta", () => {
    const { db } = freshStore();
    const t = setupTable(db);
    const cart = openCart(t, "Ana", db);
    addCartItem(cart, { product_id: 1, name: "Milanesa", qty: 1, price: 8000 }, db);
    addCartItem(cart, { product_id: 1, name: "Milanesa", qty: 2, price: 8000 }, db);
    const items = listCartItems(cart, db);
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(3);
  });

  it("cobrar cierra la cuenta, genera un pedido y alimenta caja + estadísticas", () => {
    const { db } = freshStore();
    const t = setupTable(db);
    const cart = openCart(t, "Ana", db);
    addCartItem(cart, { product_id: 1, name: "Pizza", qty: 1, price: 9500 }, db);
    addCartItem(cart, { product_id: 2, name: "Coca", qty: 2, price: 2500 }, db);

    // total en el mapa antes de cobrar
    const before = getTablesWithCarts(null, db).find((x) => x.id === t)!;
    expect(before.total).toBe(14500);

    const orderId = closeCart(cart, "cash", db);
    expect(orderId).toBeGreaterThan(0);

    // la mesa queda libre
    const after = getTablesWithCarts(null, db).find((x) => x.id === t)!;
    expect(after.total).toBe(0);

    // el cobro entró a la caja como efectivo
    const rep = cashReport(todayArg(), null, db);
    expect(rep.byMethod.cash.amount).toBe(14500);

    // y a las estadísticas de la mesa
    const stats = tableSalesStats(db);
    expect(stats[0].table_id).toBe(t);
    expect(stats[0].total).toBe(14500);
  });
});

describe("cocina (KDS)", () => {
  it("marchar envía solo los ítems nuevos (marcha incremental)", () => {
    const { db } = freshStore();
    const t = setupTable(db);
    const cart = openCart(t, "Ana", db);
    addCartItem(cart, { product_id: 1, name: "Milanesa", qty: 2, price: 8000 }, db);

    const ticket1 = sendTableToKitchen(t, 15, db);
    expect(ticket1).toBeTruthy();
    // reenviar sin novedades → nada
    expect(sendTableToKitchen(t, 15, db)).toBeNull();

    // agrego un ítem y marcho de nuevo → segunda comanda solo con lo nuevo
    addCartItem(cart, { product_id: 2, name: "Flan", qty: 1, price: 3000 }, db);
    const ticket2 = sendTableToKitchen(t, 15, db);
    expect(ticket2).toBeTruthy();

    const tickets = listKitchenTickets(db);
    expect(tickets).toHaveLength(2);
    const t2 = tickets.find((k) => k.id === ticket2)!;
    expect(t2.items).toHaveLength(1);
    expect(t2.items[0].name).toBe("Flan");
  });

  it("al marcar una comanda lista, la mesa figura con aviso (ready)", () => {
    const { db } = freshStore();
    const t = setupTable(db);
    const cart = openCart(t, "Ana", db);
    addCartItem(cart, { product_id: 1, name: "Lomo", qty: 1, price: 11000 }, db);
    const ticket = sendTableToKitchen(t, 15, db)!;

    expect(readyTableIds(db)).not.toContain(t);
    advanceKitchenTicket(ticket, "listo", db);
    expect(readyTableIds(db)).toContain(t);

    const tbl = getTablesWithCarts(null, db).find((x) => x.id === t)!;
    expect(tbl.ready).toBeGreaterThan(0);
  });
});
