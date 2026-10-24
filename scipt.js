document.addEventListener("DOMContentLoaded", () => {
    const cart = [];

    const money = amount =>
        new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR",
            maximumFractionDigits: 2
        }).format(amount);

    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.querySelector(".main-nav");

    if (menuToggle && mainNav) {
        menuToggle.addEventListener("click", () => {
            const isOpen = mainNav.classList.toggle("active");

            menuToggle.classList.toggle("active", isOpen);
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            document.body.classList.toggle("menu-open", isOpen);
        });

        mainNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                mainNav.classList.remove("active");
                menuToggle.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");
                document.body.classList.remove("menu-open");
            });
        });
    }

    const yearElement = document.getElementById("current-year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const bagCount = document.getElementById("bag-count");
    const bagItems = document.getElementById("bag-items");
    const bagSubtotal = document.getElementById("bag-subtotal");
    const bagTotal = document.getElementById("bag-total");
    const bagPanel = document.getElementById("bag-panel");
    const bagOverlay = document.getElementById("bag-overlay");
    const openBagButton = document.getElementById("open-bag");
    const closeBagButton = document.getElementById("close-bag");
    const checkoutButton = document.getElementById("checkout-button");

    function getCartCount() {
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    function getCartTotal() {
        return cart.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    }

    function renderCart() {
        if (bagCount) {
            bagCount.textContent = getCartCount();
        }

        if (bagItems) {
            bagItems.replaceChildren();

            if (cart.length === 0) {
                const emptyMessage = document.createElement("p");
                emptyMessage.className = "empty-bag";
                emptyMessage.textContent =
                    "Your bag is waiting for something beautiful.";
                bagItems.appendChild(emptyMessage);
            }

            cart.forEach(item => {
                const row = document.createElement("div");
                row.className = "bag-item";

                const details = document.createElement("div");
                details.className = "bag-item-details";

                const name = document.createElement("h4");
                name.textContent = item.name;

                const price = document.createElement("p");
                price.textContent = money(item.price);

                details.append(name, price);

                const controls = document.createElement("div");
                controls.className = "bag-item-controls";

                const decrease = document.createElement("button");
                decrease.type = "button";
                decrease.textContent = "−";
                decrease.setAttribute(
                    "aria-label",
                    `Remove one ${item.name}`
                );
                decrease.addEventListener("click", () => {
                    changeQuantity(item.name, -1);
                });

                const quantity = document.createElement("span");
                quantity.textContent = item.quantity;

                const increase = document.createElement("button");
                increase.type = "button";
                increase.textContent = "+";
                increase.setAttribute(
                    "aria-label",
                    `Add one ${item.name}`
                );
                increase.addEventListener("click", () => {
                    changeQuantity(item.name, 1);
                });

                const remove = document.createElement("button");
                remove.type = "button";
                remove.textContent = "Remove";
                remove.addEventListener("click", () => {
                    removeFromCart(item.name);
                });

                controls.append(decrease, quantity, increase, remove);
                row.append(details, controls);
                bagItems.appendChild(row);
            });
        }

        const total = getCartTotal();

        if (bagSubtotal) {
            bagSubtotal.textContent = money(total);
        }

        if (bagTotal) {
            bagTotal.textContent = money(total);
        }

        if (checkoutButton) {
            checkoutButton.disabled = cart.length === 0;
        }
    }

    function addToCart(name, price) {
        if (!Number.isFinite(price) || price <= 0) {
            showNotice(
                "This product's price must be confirmed before adding it to your bag."
            );
            return;
        }

        const existingItem = cart.find(item => item.name === name);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                name,
                price,
                quantity: 1
            });
        }

        renderCart();
        showBag();
        showNotice(`${name} added to your bag.`);
    }

    function changeQuantity(name, amount) {
        const item = cart.find(product => product.name === name);

        if (!item) return;

        item.quantity += amount;

        if (item.quantity <= 0) {
            removeFromCart(name);
            return;
        }

        renderCart();
    }

    function removeFromCart(name) {
        const index = cart.findIndex(item => item.name === name);

        if (index !== -1) {
            cart.splice(index, 1);
        }

        renderCart();
    }

    function showBag() {
        if (bagPanel) {
            bagPanel.classList.add("open");
            bagPanel.setAttribute("aria-hidden", "false");
        }

        if (bagOverlay) {
            bagOverlay.classList.add("visible");
        }
    }

    function hideBag() {
        if (bagPanel) {
            bagPanel.classList.remove("open");
            bagPanel.setAttribute("aria-hidden", "true");
        }

        if (bagOverlay) {
            bagOverlay.classList.remove("visible");
        }
    }

    if (openBagButton) {
        openBagButton.addEventListener("click", showBag);
    }

    if (closeBagButton) {
        closeBagButton.addEventListener("click", hideBag);
    }

    if (bagOverlay) {
        bagOverlay.addEventListener("click", hideBag);
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            hideBag();
        }
    });

    document.querySelectorAll(".product-order").forEach(button => {
        button.addEventListener("click", () => {
            const name = button.dataset.product;
            const price = Number(button.dataset.price);

            if (!name) {
                showNotice("Product information is missing.");
                return;
            }

            addToCart(name, price);
        });
    });

    if (checkoutButton) {
        checkoutButton.addEventListener("click", () => {
            if (cart.length === 0) {
                showNotice("Your bag is empty.");
                return;
            }

            const checkoutSection = document.getElementById("checkout");

            if (checkoutSection) {
                hideBag();

                checkoutSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            } else {
                showNotice(
                    "The checkout section still needs to be added."
                );
            }
        });
    }

    let noticeTimer;

    function showNotice(message) {
        let notice = document.getElementById("amity-notice");

        if (!notice) {
            notice = document.createElement("div");
            notice.id = "amity-notice";
            notice.setAttribute("role", "status");
            notice.setAttribute("aria-live", "polite");

            Object.assign(notice.style, {
                position: "fixed",
                bottom: "24px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#111111",
                color: "#dfc69b",
                border: "1px solid #c6a56b",
                padding: "14px 22px",
                borderRadius: "4px",
                zIndex: "99999",
                maxWidth: "90%",
                textAlign: "center",
                boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
            });

            document.body.appendChild(notice);
        }

        notice.textContent = message;
        notice.style.display = "block";

        clearTimeout(noticeTimer);

        noticeTimer = setTimeout(() => {
            notice.style.display = "none";
        }, 3000);
    }

    renderCart();
});