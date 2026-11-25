const productForm = document.getElementById("productForm");
const tableBody   = document.getElementById("productTableBody");
const feedback    = document.getElementById("feedback");
const recordCount = document.getElementById("recordCount");

function statusClass(status) {
    if (status === "In Stock")  return "status-in-stock";
    if (status === "Low Stock") return "status-low-stock";
    return "status-out-of-stock";
}

function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = "feedback " + type;
    feedback.hidden = false;
}

function renderProducts(products) {
    tableBody.innerHTML = "";

    if (products.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="9" class="empty-row">No products found.</td></tr>';
    } else {
        products.forEach(p => {
            const row = document.createElement("tr");

            // textContent keeps user-provided values safe.
            [p.product_id, p.sku, p.product_name, p.category, p.supplier,
             "RM " + Number(p.unit_price).toFixed(2), p.stock_quantity, p.reorder_level
            ].forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

            const statusTd = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "status " + statusClass(p.stock_status);
            badge.textContent = p.stock_status;
            statusTd.appendChild(badge);
            row.appendChild(statusTd);

            tableBody.appendChild(row);
        });
    }

    recordCount.textContent =
        products.length + (products.length === 1 ? " record" : " records");
}

async function loadProducts() {
    try {
        const res = await fetch("/api/products");
        renderProducts(await res.json());
    } catch (error) {
        showFeedback("Cannot reach the server.", "error");
    }
}

productForm.addEventListener("submit", async event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(productForm).entries());

    try {
        const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
            const detail = Array.isArray(result.details)
                ? result.details.join(" ")
                : result.error;
            showFeedback(detail || "Request failed.", "error");
            return;
        }

        productForm.reset();
        showFeedback(result.message + " " + result.product.product_name + " added.", "success");
        await loadProducts();
    } catch (error) {
        showFeedback("Cannot reach the server.", "error");
    }
});

productForm.addEventListener("reset", () => { feedback.hidden = true; });

loadProducts(); // GET /api/products when the page opens