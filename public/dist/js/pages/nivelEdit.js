function redirectToSelectedOption() {
  var selectElement = document.getElementById("page");
  var selectedOption = selectElement.options[selectElement.selectedIndex].value;
  window.location.href = "/pagesEdit/nivel/" + selectedOption;
}
