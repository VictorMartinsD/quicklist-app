/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Script principal para funcionalidades do site.
*/

import { clamp, escapeHTML, formatCurrencyBRL, formatDate, generateId } from "./utils.js";

const input = document.querySelector("#item");
const btnAddItem = document.querySelector(".btn-add-item");

btnAddItem.addEventListener("click", () => {
  const text = input.value.trim();

  if (text !== "") {
    console.log("Texto capturado:", text);

    input.value = "";
    input.focus();
  } else {
    alert("Por favor, digite algo!");
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    btnAddItem.click();
  }
});
