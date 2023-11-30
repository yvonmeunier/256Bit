function CopyToClip(target) {
    // Get the text field
    var copyText = document.getElementById(target).getAttribute("value");
    navigator.clipboard.writeText(copyText);
}
//# sourceMappingURL=copytoclip.js.map