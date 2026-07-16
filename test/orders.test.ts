import { describe, it, expect } from "vitest";
import { createOrder, getOrders, getOrderItems, cashReport, OutOfStockError } from "../lib/db";
import { freshStore, firstBranchId, addProduct } from "./helper";

const nowIso = () => new Date().toISOString();
const todayArg = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

function baseOrder(over: Partial<Parameters<typeof createOrder>[0]> = {}) {
  return {
    code: "O", branch_id: null, customer_name: "Cliente", phone: "", address: "",
    delivery: "pickup", payment: "cash", notes: "",
    items: [{ name: "x", qty: 1, price: 1000 }], subtotal: 1000, shipping: 0, total: 1000,
    invoice: false, cuit: "", payment_status: "offline", created_at: nowIso(), ...over,
  };
}

describe("createOrder", () => {
  it("descuenta stock de la sucursal y escribe order_items (dual-write)", () => {
    const { db } = freshStore();
    const br = firstBranchId(db);
    const pid = addProduct(db, "Pizza", 9500, 5, br);
    const id = createOrder(baseOrder({
      branch_id: br, payment: "cash",
      items: [{ product_id: pid, name: "Pizza", qty: 2, price: 9500 }], subtotal: 19000, total: 19000,
    }), db);
    expect(id).toBeGreaterThan(0);
    const stock = (db.prepare("SELECT stock FROM product_branches WHERE product_id=? AND branch_id=?").get(pid, br) as { stock: number }).stock;
    expect(stock).toBe(3);
    const items = getOrderItems(id, db);
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(2);
    expect(items[0].name).toBe("Pizza");
  });

  it("lanza OutOfStockError si el pedido supera el stock", () => {
    const { db } = freshStore();
    const br = firstBranchId(db);
    const pid = addProduct(db, "Empanada", 900, 3, br);
    expect(() => createOrder(baseOrder({
      branch_id: br, items: [{ product_id: pid, name: "Empanada", qty: 10, price: 900 }],
    }), db)).toThrow(OutOfStockError);
    // el stock no se tocó
    const stock = (db.prepare("SELECT stock FROM product_branches WHERE product_id=? AND branch_id=?").get(pid, br) as { stock: number }).stock;
    expect(stock).toBe(3);
  });
});

describe("tablero de pedidos", () => {
  it("getOrders excluye las ventas de mesa (table_id) pero incluye las web", () => {
    const { db } = freshStore();
    const web = createOrder(baseOrder({ code: "WEB" }), db);
    const mesa = createOrder(baseOrder({ code: "MESA" }), db);
    db.prepare("UPDATE orders SET table_id = 1 WHERE id = ?").run(mesa);
    const board = getOrders({}, db);
    const codes = board.map((o) => o.code);
    expect(codes).toContain("WEB");
    expect(codes).not.toContain("MESA");
    expect(board.find((o) => o.id === web)).toBeTruthy();
  });
});

describe("cashReport (caja)", () => {
  it("agrupa las ventas del día por medio de pago", () => {
    const { db } = freshStore();
    createOrder(baseOrder({ payment: "cash", total: 5000 }), db);
    createOrder(baseOrder({ payment: "cash", total: 3000 }), db);
    createOrder(baseOrder({ payment: "transfer", total: 8000 }), db);
    createOrder(baseOrder({ payment: "online", total: 12000 }), db);
    const rep = cashReport(todayArg(), null, db);
    expect(rep.byMethod.cash.amount).toBe(8000);
    expect(rep.byMethod.cash.count).toBe(2);
    expect(rep.byMethod.transfer.amount).toBe(8000);
    expect(rep.byMethod.online.amount).toBe(12000);
    expect(rep.totalSales).toBe(28000);
    expect(rep.ordersCount).toBe(4);
  });

  it("no cuenta los pedidos cancelados en el total", () => {
    const { db } = freshStore();
    const id = createOrder(baseOrder({ payment: "cash", total: 5000 }), db);
    db.prepare("UPDATE orders SET status = 'cancelado' WHERE id = ?").run(id);
    const rep = cashReport(todayArg(), null, db);
    expect(rep.totalSales).toBe(0);
    expect(rep.cancelledCount).toBe(1);
  });
});
