(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const menu = $("#menu");
  const cartButton = $("#cart-btn");
  const cartModal = $("#cart-modal");
  const cartItemsContainer = $("#cart-items");
  const cartTotal = $("#cart-total");
  const cartCounter = $("#cart-count");
  const addressStreet = $("#address-street");
  const addressNumber = $("#address-number");
  const addressNeighborhood = $("#address-neighborhood");
  const addressComplement = $("#address-complement");
  const addressWarn = $("#address-warn");
  const checkoutButton = $("#checkout-btn");
  const closeModalButton = $("#close-modal-btn");
  const addressFields = $("#address-fields");
  const addressBackButton = $("#address-back-btn");
  const successModal = $("#order-success");
  const successCloseButton = $("#success-close-btn");
  const searchInput = $("#menu-search");
  const emptySearchMessage = $("#menu-empty");
  const STORAGE_KEY = "burger-prime-cart-v1";
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  if (!menu || !cartButton || !cartModal || !cartItemsContainer || !cartTotal || !cartCounter) return;

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter((item) => item && typeof item.name === "string" && Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
    } catch {
      return []; 
    }
  }

  let cart = loadCart();
  let addressStep = false;

  function setAddressStep(showAddress) {
    addressStep = showAddress;
    if (addressFields) addressFields.hidden = !showAddress;
    if (addressBackButton) addressBackButton.hidden = !showAddress;
    if (checkoutButton) checkoutButton.textContent = showAddress ? "Finalizar pedido" : "Confirmar itens e informar endereço";
  }

  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* armazenamento pode estar indisponível */ }
  }

  function renderCart() {
    cartItemsContainer.replaceChildren();
    let total = 0;
    let count = 0;

    if (!cart.length) {
      const empty = document.createElement("p");
      empty.className = "text-center text-gray-500 py-4";
      empty.textContent = "Seu carrinho está vazio.";
      cartItemsContainer.append(empty);
    }

    cart.forEach((item) => {
      total += item.price * item.quantity;
      count += item.quantity;

      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-3 border-b py-3";
      const details = document.createElement("div");
      details.className = "min-w-0";
      const name = document.createElement("p");
      name.className = "font-semibold";
      name.textContent = item.name;
      const price = document.createElement("p");
      price.className = "text-sm text-gray-600";
      price.textContent = `${money.format(item.price)} cada`;
      details.append(name, price);

      const controls = document.createElement("div");
      controls.className = "flex items-center gap-2 shrink-0";
      const minus = makeButton("−", "Diminuir quantidade", "decrease", item.name);
      const quantity = document.createElement("span");
      quantity.className = "min-w-5 text-center";
      quantity.textContent = String(item.quantity);
      const plus = makeButton("+", "Aumentar quantidade", "increase", item.name);
      const remove = makeButton("Remover", `Remover ${item.name}`, "remove", item.name);
      remove.className = "text-sm text-red-600 underline ml-1";
      controls.append(minus, quantity, plus, remove);
      row.append(details, controls);
      cartItemsContainer.append(row);
    });

    cartTotal.textContent = money.format(total);
    cartCounter.textContent = String(count);
    cartItemsContainer.classList.remove("cart-needs-item");
    if (!cart.length && addressStep) setAddressStep(false);
    saveCart();
  }

  function makeButton(label, ariaLabel, action, name) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    button.dataset.cartAction = action;
    button.dataset.name = name;
    button.className = "rounded border px-2 py-1 hover:bg-gray-100";
    return button;
  }

  function addToCart(name, price) {
    if (!name || !Number.isFinite(price) || price < 0) return;
    const item = cart.find((entry) => entry.name === name);
    if (item) item.quantity += 1;
    else cart.push({ name, price, quantity: 1 });
    renderCart();
  }

  function setModal(open) {
    cartModal.classList.toggle("hidden", !open);
    cartModal.classList.toggle("flex", open);
    document.body.classList.toggle("overflow-hidden", open);
    cartModal.setAttribute("aria-hidden", String(!open));
    if (open) setTimeout(() => addressStreet?.focus(), 0);
  }

  menu.addEventListener("click", (event) => {
    const button = event.target.closest(".add-to-cart-btn");
    if (!button || !menu.contains(button)) return;
    addToCart(button.dataset.name?.trim(), Number(button.dataset.price));
  });

  cartItemsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;
    const index = cart.findIndex((item) => item.name === button.dataset.name);
    if (index < 0) return;
    if (button.dataset.cartAction === "increase") cart[index].quantity += 1;
    if (button.dataset.cartAction === "decrease") cart[index].quantity -= 1;
    if (button.dataset.cartAction === "remove" || cart[index].quantity <= 0) cart.splice(index, 1);
    renderCart();
  });

  cartButton.addEventListener("click", () => setModal(true));
  closeModalButton?.addEventListener("click", () => setModal(false));
  addressBackButton?.addEventListener("click", () => setAddressStep(false));
  cartModal.addEventListener("click", (event) => { if (event.target === cartModal) setModal(false); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !cartModal.classList.contains("hidden")) setModal(false); });

  [addressStreet, addressNumber, addressNeighborhood].forEach((field) => {
    field?.addEventListener("input", () => {
      const addressIsComplete = [addressStreet, addressNumber, addressNeighborhood].every((input) => input?.value.trim());
      if (addressIsComplete) addressWarn?.classList.add("hidden");
    });
  });

  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
    let visible = 0;
    menu.querySelectorAll(".product-card").forEach((card) => {
      const matches = card.textContent.toLocaleLowerCase("pt-BR").includes(query);
      card.classList.toggle("hidden", !matches);
      if (matches) visible += 1;
    });
    if (emptySearchMessage) emptySearchMessage.classList.toggle("hidden", visible !== 0);
  });

  checkoutButton?.addEventListener("click", async () => {
    if (!cart.length) {
      cartItemsContainer.classList.add("cart-needs-item");
      cartButton.focus();
      return;
    }
    if (!addressStep) {
      setAddressStep(true);
      addressStreet?.focus();
      return;
    }
    const street = addressStreet?.value.trim() || "";
    const number = addressNumber?.value.trim() || "";
    const neighborhood = addressNeighborhood?.value.trim() || "";
    const complement = addressComplement?.value.trim() || "";
    if (!street || !number || !neighborhood) {
      addressWarn?.classList.remove("hidden");
      (street ? number ? addressNeighborhood : addressNumber : addressStreet)?.focus();
      return;
    }
    addressWarn?.classList.add("hidden");

    const address = `${street}, ${number}, ${neighborhood}${complement ? `, complemento: ${complement}` : ""}`;
    const lines = cart.map((item) => `${item.quantity}x ${item.name} — ${money.format(item.price * item.quantity)}`);
    const orderText = ["Olá! Quero fazer este pedido:", ...lines, `Total: ${money.format(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}`, `Endereço: ${address}`].join("\n");
    const phone = (checkoutButton.dataset.whatsapp || "").replace(/\D/g, "");
    if (phone.length >= 10) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(orderText)}`, "_blank", "noopener,noreferrer");
      showOrderSuccess();
      return;
    }

    try {
      await navigator.clipboard.writeText(orderText);
      showOrderSuccess("Pedido confirmado!");
    } catch {
      window.prompt("Copie os dados do pedido:", orderText);
      showOrderSuccess("Pedido pronto para enviar", "Copie os detalhes do pedido e envie para a loja.");
    }
  });

  function showOrderSuccess(title = "Pedido recebido!", message = "Estamos preparando seu pedido com carinho.") {
    const titleElement = successModal?.querySelector("h2");
    const messageElement = successModal?.querySelector("p");
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (successModal) successModal.hidden = false;
    setModal(false);
  }

  successCloseButton?.addEventListener("click", () => {
    if (successModal) successModal.hidden = true;
  });

  setAddressStep(false);
  renderCart();
})();
