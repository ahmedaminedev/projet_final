// JavaScript

const signupBtn = document.querySelector("#signup"),
  loginBtn = document.querySelector("#login"),
  pwShowHide = document.querySelectorAll(".pw_hide");

// Supprimer le formOpenBtn et formCloseBtn car ils ne sont plus nécessaires.

pwShowHide.forEach((icon) => {
  icon.addEventListener("click", () => {
    let getPwInput = icon.parentElement.querySelector("input");
    if (getPwInput.type === "password") {
      getPwInput.type = "text";
      icon.classList.replace("uil-eye-slash", "uil-eye");
    } else {
      getPwInput.type = "password";
      icon.classList.replace("uil-eye", "uil-eye-slash");
    }
  });
});

signupBtn.addEventListener("click", (e) => {
  e.preventDefault();
  document.querySelector(".form_container").classList.add("active");
});
loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  document.querySelector(".form_container").classList.remove("active");
});
