const accessKey = "thirdStudioVisitorRequiredInfo";
const supabaseUrl = "https://urncjwmoosmpogasfmba.supabase.co";
const supabasePublishableKey = "sb_publishable_n7weg275d-n7vtru0M_lfQ_aVK5U_Yb";
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const hasAccess = Boolean(localStorage.getItem(accessKey));
const accessForm = document.getElementById("accessForm");
const accessScreen = document.getElementById("accessScreen");
const accessStatus = document.getElementById("accessStatus");

if (!hasAccess && currentPage !== "index.html") {
  window.location.replace("index.html");
}

if (hasAccess) {
  document.body.classList.remove("needs-access");
  if (accessScreen) {
    accessScreen.hidden = true;
  }
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

    if (!visitor.name || !visitor.age || !visitor.email) {
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

      if (!response.ok) {
        throw new Error("Supabase save failed");
      }

      localStorage.setItem(accessKey, JSON.stringify(visitor));
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
