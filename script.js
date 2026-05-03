const accessKey = "thirdStudioVisitorRequiredInfoV2";
const accessCooldownKey = "thirdStudioVisitorLastSubmitV2";
const accessCooldownMs = 10000;
const supabaseUrl = "https://urncjwmoosmpogasfmba.supabase.co";
const supabasePublishableKey = "sb_publishable_n7weg275d-n7vtru0M_lfQ_aVK5U_Yb";
const userInfoTableUrl = `${supabaseUrl}/rest/v1/USER%20INFO`;
const profileBucket = "profile-images";
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const accessForm = document.getElementById("accessForm");
const accessScreen = document.getElementById("accessScreen");
const accessStatus = document.getElementById("accessStatus");
const visitorProfile = document.getElementById("visitorProfile");
const visitorImage = document.getElementById("visitorImage");
const visitorName = document.getElementById("visitorName");

function getStoredVisitor() {
  try {
    const visitor = JSON.parse(localStorage.getItem(accessKey) || "null");
    if (
      visitor &&
      typeof visitor.id === "string" &&
      typeof visitor.name === "string" &&
      Number.isInteger(visitor.age) &&
      typeof visitor.email === "string" &&
      typeof visitor.profileImagePath === "string"
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

function validateProfileImage(file) {
  if (!file || !file.size) {
    return "Please choose a profile image.";
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Please choose a JPG, PNG, or WEBP image.";
  }

  if (file.size > 2 * 1024 * 1024) {
    return "Please choose an image smaller than 2 MB.";
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

async function uploadProfileImage(userId, file) {
  const extension = file.type === "image/png"
    ? "png"
    : file.type === "image/webp"
      ? "webp"
      : "jpg";
  const imagePath = `${userId}/profile.${extension}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${profileBucket}/${imagePath}`, {
    method: "POST",
    headers: {
      "apikey": supabasePublishableKey,
      "Authorization": `Bearer ${supabasePublishableKey}`,
      "Content-Type": file.type,
      "X-User-Info-Id": userId,
      "x-upsert": "true"
    },
    body: file
  });

  if (!response.ok) {
    throw new Error("Profile image upload failed");
  }

  return imagePath;
}

async function loadProfileImage(visitor) {
  if (!visitorProfile || !visitorImage || !visitor.profileImagePath) {
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${profileBucket}/${visitor.profileImagePath}`, {
      headers: {
        "apikey": supabasePublishableKey,
        "Authorization": `Bearer ${supabasePublishableKey}`,
        "X-User-Info-Id": visitor.id
      }
    });

    if (!response.ok) {
      throw new Error("Profile image load failed");
    }

    const blob = await response.blob();
    visitorImage.src = URL.createObjectURL(blob);
    if (visitorName) {
      visitorName.textContent = visitor.name;
    }
    visitorProfile.hidden = false;
  } catch (error) {
    visitorProfile.hidden = true;
  }
}

const hasAccess = Boolean(getStoredVisitor());

if (!hasAccess && currentPage !== "index.html") {
  window.location.replace("index.html");
}

if (hasAccess) {
  openWebsite();
  loadProfileImage(getStoredVisitor());
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
    const profileImage = formData.get("profile_image");
    const validationError = validateVisitor(visitor);
    const imageError = validateProfileImage(profileImage);

    if (validationError || imageError) {
      if (accessStatus) {
        accessStatus.textContent = validationError || imageError;
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
      const profileImagePath = await uploadProfileImage(userId, profileImage);
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
          email: visitor.email,
          profile_image_path: profileImagePath
        })
      });

      localStorage.setItem(accessCooldownKey, String(Date.now()));

      if (!response.ok) {
        throw new Error("Supabase save failed");
      }

      localStorage.setItem(accessKey, JSON.stringify({
        id: userId,
        ...visitor,
        profileImagePath,
        savedAt: new Date().toISOString()
      }));
      openWebsite();
      loadProfileImage(getStoredVisitor());
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
          "X-User-Info-Id": storedVisitor.id,
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
