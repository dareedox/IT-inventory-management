const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Temporary in-memory data.
let products = [
  { product_id: 1, sku: "DL-LAT-5440", product_name: "Dell Latitude 5440", category: "Laptop",     supplier: "Dell Technologies", unit_price: 4299.00, stock_quantity: 12, reorder_level: 5 },
  { product_id: 2, sku: "HP-PD-400",   product_name: "HP ProDesk 400 G9",  category: "Desktop",    supplier: "HP Inc.",           unit_price: 3199.00, stock_quantity: 4,  reorder_level: 5 },
  { product_id: 3, sku: "LN-TP-E14",   product_name: "Lenovo ThinkPad E14", category: "Laptop",    supplier: "Lenovo",            unit_price: 3599.00, stock_quantity: 0,  reorder_level: 3 },
  { product_id: 4, sku: "LG-C920",     product_name: "Logitech C920 Webcam", category: "Peripheral", supplier: "Logitech",         unit_price: 279.00,  stock_quantity: 25, reorder_level: 10 }
];

function withStatus(p) {
  const stock_status =
    p.stock_quantity <= 0 ? "Out of Stock" :
    p.stock_quantity <= p.reorder_level ? "Low Stock" : "In Stock";
  return { ...p, stock_status };
}

// GET /api/products
app.get("/api/products", (req, res) => {
  res.json(products.map(withStatus));
});

// POST /api/products
app.post("/api/products", (req, res) => {
  const b = req.body || {};
  const sku = String(b.sku || "").trim();
  const name = String(b.product_name || "").trim();
  const category = String(b.category || "").trim();
  const supplier = String(b.supplier || "").trim();
  const price = Number(b.unit_price);
  const qty = Number(b.stock_quantity);
  const reorder = Number(b.reorder_level);

  const errors = [];
  if (!/^[A-Za-z0-9-]{3,20}$/.test(sku)) errors.push("SKU must be 3-20 letters, numbers or hyphens.");
  if (!name || name.length > 100) errors.push("Product name is required (max 100 characters).");
  if (!category) errors.push("Category is required.");
  if (!supplier) errors.push("Supplier is required.");
  if (!Number.isFinite(price) || price < 0) errors.push("Unit price must be 0 or more.");
  if (!Number.isInteger(qty) || qty < 0) errors.push("Stock quantity must be a whole number >= 0.");
  if (!Number.isInteger(reorder) || reorder < 0) errors.push("Reorder level must be a whole number >= 0.");

  if (errors.length) return res.status(400).json({ error: "Validation failed.", details: errors });

  if (products.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
    return res.status(409).json({ error: "This SKU already exists." });
  }

  const product = {
    product_id: products.length ? Math.max(...products.map(p => p.product_id)) + 1 : 1,
    sku, product_name: name, category, supplier,
    unit_price: price, stock_quantity: qty, reorder_level: reorder
  };

  products.unshift(product);
  res.status(201).json({ message: "Product created.", product: withStatus(product) });
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

app.listen(PORT, () => console.log("Running on http://localhost:" + PORT));