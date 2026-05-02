const accessKey = "thirdStudioVisitorRequiredInfo";
const accessCooldownKey = "thirdStudioVisitorLastSubmit";
const accessCooldownMs = 10000;
const supabaseUrl = "https://urncjwmoosmpogasfmba.supabase.co";
const supabasePublishableKey = "sb_publishable_n7weg275d-n7vtru0M_lfQ_aVK5U_Yb";
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const accessForm = document.getElementById("accessForm");
const accessScreen = document.getElementById("accessScreen");
const accessStatus = document.getElementById("accessStatus");

function getStoredVisitor() {
  try {
    const visitor = JSON.parse(localStorage.getItem(accessKey) || "null");
    if (
      visitor &&
      typeof visitor.name === "string" &&
      Number.isInteger(visitor.age) &&
      typeof visitor.email === "string"
    ) {
      return visitor;
    }
  } catch (error) {
    localStorage.removeItem(accessKey);
  }

  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateVisitor(visitor) {
  if (visitor.name.length < 1 || visitor.name.length > 120) {
    return "Please enter a name between 1 and 120 letters.";
  }

  if (!Number.isInteger(visitor.age) || visitor.age < 1 || visitor.age > 120) {
    return "Please enter a real age from 1 to 120.";
  }

  if (!isValidEmail(visitor.email)) {
    return "Please enter a valid email address.";
  }

  return "";
}

function openWebsite() {
  document.body.classList.remove("needs-access");
  document.body.classList.add("has-access");
  if (accessScreen) {
    accessScreen.hidden = true;
    accessScreen.style.display = "none";
  }
}

const hasAccess = Boolean(getStoredVisitor());

if (!hasAccess && currentPage !== "index.html") {
  window.location.replace("index.html");
}

if (hasAccess) {
  openWebsite();
}

if (accessForm) {
  accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(accessForm);
    const visitor = {
      name: String(formData.get("name") || "").trim(),
      age: Number(formData.get("age")),
      email: String(formData.get("email") || "").trim()
    };
    const validationError = validateVisitor(visitor);

    if (validationError) {
      if (accessStatus) {
        accessStatus.textContent = validationError;
      }
      return;
    }

    const lastSubmit = Number(localStorage.getItem(accessCooldownKey) || 0);
    const remainingCooldown = accessCooldownMs - (Date.now() - lastSubmit);
    if (remainingCooldown > 0) {
      if (accessStatus) {
        accessStatus.textContent = `Please wait ${Math.ceil(remainingCooldown / 1000)} seconds before trying again.`;
      }
      return;
    }

    const submitButton = accessForm.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving...";
    }
    if (accessStatus) {
      accessStatus.textContent = "Saving your information...";
    }

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/website_visitors`, {
        method: "POST",
        headers: {
          "apikey": supabasePublishableKey,
          "Authorization": `Bearer ${supabasePublishableKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(visitor)
      });

      localStorage.setItem(accessCooldownKey, String(Date.now()));

      if (!response.ok) {
        throw new Error("Supabase save failed");
      }

      localStorage.setItem(accessKey, JSON.stringify({
        ...visitor,
        savedAt: new Date().toISOString()
      }));
      openWebsite();
      window.location.href = "index.html";
    } catch (error) {
      if (accessStatus) {
        accessStatus.textContent = "Could not save. Please check the info and try again.";
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enter Website";
      }
    }
  });
}

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    projectCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();

    formStatus.textContent = name
      ? `Thanks, ${name}. Your message is ready.`
      : "Thanks. Your message is ready.";

    contactForm.reset();
  });
}
