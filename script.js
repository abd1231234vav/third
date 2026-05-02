const accessKey = "thirdStudioVisitorRequiredInfoV2";
const accessCooldownKey = "thirdStudioVisitorLastSubmitV2";
const accessCooldownMs = 10000;
const supabaseUrl = "https://urncjwmoosmpogasfmba.supabase.co";
const supabasePublishableKey = "sb_publishable_n7weg275d-n7vtru0M_lfQ_aVK5U_Yb";
const userInfoTableUrl = `${supabaseUrl}/rest/v1/USER%20INFO`;
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const accessForm = document.getElementById("accessForm");
const accessScreen = document.getElementById("accessScreen");
const accessStatus = document.getElementById("accessStatus");

function getStoredVisitor() {
  try {
    const visitor = JSON.parse(localStorage.getItem(accessKey) || "null");
    if (
      visitor &&
      typeof visitor.id === "string" &&
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

function validateContactMessage(message) {
  if (!isValidEmail(message.email)) {
    return "Please enter a valid email address.";
  }

  if (!["Website", "Portfolio", "Business Page", "Other"].includes(message.project_type)) {
    return "Please choose a project type.";
  }

  if (message.message.length < 1 || message.message.length > 2000) {
    return "Please write a message between 1 and 2000 letters.";
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
      const userId = crypto.randomUUID();
      const response = await fetch(userInfoTableUrl, {
        method: "POST",
        headers: {
          "apikey": supabasePublishableKey,
          "Authorization": `Bearer ${supabasePublishableKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          id: userId,
          name: visitor.name,
          age: visitor.age,
          email: visitor.email
        })
      });

      localStorage.setItem(accessCooldownKey, String(Date.now()));

      if (!response.ok) {
        throw new Error("Supabase save failed");
      }

      localStorage.setItem(accessKey, JSON.stringify({
        id: userId,
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
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const storedVisitor = getStoredVisitor();
    if (!storedVisitor) {
      window.location.href = "index.html";
      return;
    }

    const formData = new FormData(contactForm);
    const contactMessage = {
      email: String(formData.get("email") || "").trim(),
      project_type: String(formData.get("project") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };
    const validationError = validateContactMessage(contactMessage);

    if (validationError) {
      formStatus.textContent = validationError;
      return;
    }

    const submitButton = contactForm.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    formStatus.textContent = "Sending your message...";

    try {
      const response = await fetch(`${userInfoTableUrl}?id=eq.${encodeURIComponent(storedVisitor.id)}`, {
        method: "PATCH",
        headers: {
          "apikey": supabasePublishableKey,
          "Authorization": `Bearer ${supabasePublishableKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          email: contactMessage.email,
          project_type: contactMessage.project_type,
          message: contactMessage.message,
          contact_submitted_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("Supabase save failed");
      }

      localStorage.setItem(accessKey, JSON.stringify({
        ...storedVisitor,
        email: contactMessage.email,
        project_type: contactMessage.project_type,
        message: contactMessage.message,
        contactSubmittedAt: new Date().toISOString()
      }));

      formStatus.textContent = "Thanks. Your message was saved.";

      contactForm.reset();
    } catch (error) {
      formStatus.textContent = "Could not send your message. Please try again.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    }
  });
}
